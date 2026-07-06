import { useQueryClient } from "@tanstack/react-query";
import {
  useGetFeedSummary,
  useListFriends,
  useListUsers,
  useSendFriendRequest,
  getListFriendsQueryKey,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { UserPlus } from "lucide-react";

export function SidebarRight() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: summary } = useGetFeedSummary({ query: { refetchInterval: 8_000 } });
  const { data: friendsData } = useListFriends({ query: { refetchInterval: 10_000 } });
  const { data: allUsers } = useListUsers({ query: { refetchInterval: 15_000 } });
  const sendFriendRequest = useSendFriendRequest();

  const friends = friendsData?.friends || [];
  const friendIds = new Set(friends.map((f) => f.id));
  const pendingToIds = new Set((friendsData?.pendingRequests || []).map((r) => r.fromUserId));

  const suggestions = (allUsers || []).filter(
    (u) => !u.isCurrentUser && !friendIds.has(u.id) && !pendingToIds.has(u.id)
  ).slice(0, 4);

  function handleAdd(userId: number) {
    sendFriendRequest.mutate({ data: { toUserId: userId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
    });
  }

  function handleMessage(userId: number) {
    setLocation(`/messages?userId=${userId}`);
  }

  return (
    <div className="flex flex-col gap-4 pl-4 pr-2">
      {/* Stats */}
      <div className="pb-4 border-b">
        <h3 className="text-muted-foreground font-semibold mb-3 px-2">Ringkasan</h3>
        <div className="space-y-2.5 px-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Post</span>
            <span className="font-medium">{summary?.totalPosts || 0}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Like</span>
            <span className="font-medium">{summary?.totalLikes || 0}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Teman Online</span>
            <span className="font-medium text-green-600">{summary?.onlineFriendsCount || 0}</span>
          </div>
          {(summary?.unreadMessages ?? 0) > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Pesan Baru</span>
              <Link href="/messages">
                <span className="font-bold text-primary cursor-pointer hover:underline">
                  {summary?.unreadMessages}
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Friend suggestions */}
      {suggestions.length > 0 && (
        <div className="pb-3 border-b">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-muted-foreground font-semibold text-sm">Mungkin Kamu Kenal</h3>
            <Link href="/friends">
              <span className="text-primary text-xs hover:underline cursor-pointer">Lihat semua</span>
            </Link>
          </div>
          <div className="space-y-1">
            {suggestions.map((user) => (
              <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted group transition-colors">
                <Link href={`/profile/${user.id}`}>
                  <Avatar className="w-9 h-9 cursor-pointer flex-shrink-0">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user.id}`}>
                    <p className="text-xs font-semibold truncate hover:underline cursor-pointer">{user.name}</p>
                  </Link>
                  <p className="text-[10px] text-muted-foreground">{user.friendCount} teman</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => handleAdd(user.id)}
                  disabled={sendFriendRequest.isPending}
                >
                  <UserPlus className="w-3 h-3" />
                  Tambah
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts (friends) */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-muted-foreground font-semibold text-sm">Kontak</h3>
          {friends.length > 0 && (
            <span className="text-[10px] text-muted-foreground">{friends.length} teman</span>
          )}
        </div>
        <div className="space-y-0.5">
          {friends.slice(0, 12).map((friend) => (
            <button
              key={friend.id}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors text-left"
              onClick={() => handleMessage(friend.id)}
            >
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={friend.avatarUrl} alt={friend.name} />
                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
              </div>
              <span className="text-sm font-medium">{friend.name}</span>
            </button>
          ))}
          {friends.length === 0 && (
            <div className="p-2 text-xs text-muted-foreground text-center">
              Belum ada teman. <Link href="/friends"><span className="text-primary hover:underline cursor-pointer">Tambah sekarang</span></Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
