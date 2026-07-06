import { useQueryClient } from "@tanstack/react-query";
import {
  useGetUser,
  useListPosts,
  useGetCurrentUser,
  useSendFriendRequest,
  getListPostsQueryKey,
  getListFriendsQueryKey,
} from "@workspace/api-client-react";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, UserCheck, Pencil, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function Profile({ userId }: { userId: number }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useGetUser(userId);
  const { data: currentUser } = useGetCurrentUser();
  const { data: posts, isLoading: postsLoading } = useListPosts(
    { userId },
    { query: { queryKey: getListPostsQueryKey({ userId }) } }
  );
  const sendFriendRequest = useSendFriendRequest();

  function handleAddFriend() {
    sendFriendRequest.mutate(
      { data: { toUserId: userId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
        },
      }
    );
  }

  if (userLoading) {
    return (
      <div>
        <Skeleton className="w-full h-48 rounded-xl mb-4" />
        <div className="flex items-end gap-4 px-4 -mt-12 mb-6">
          <Skeleton className="w-36 h-36 rounded-full border-4 border-background" />
          <div className="mb-4 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">User not found.</div>;
  }

  const isMe = user.isCurrentUser;
  const isFriend = user.friendshipStatus === "accepted";
  const isPending = user.friendshipStatus === "pending";

  return (
    <div>
      {/* Cover Photo */}
      <div className="relative rounded-xl overflow-hidden mb-0">
        <img
          src={user.coverUrl}
          alt="Cover"
          className="w-full h-48 object-cover"
          data-testid="img-profile-cover"
        />
      </div>

      {/* Profile Info */}
      <Card className="mb-4 rounded-t-none shadow-sm">
        <CardContent className="pt-0 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 sm:-mt-14 mb-4">
            <Avatar className="w-28 h-28 sm:w-36 sm:h-36 border-4 border-background ring-0 shadow-lg flex-shrink-0">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 sm:mb-2">
              <h1 className="text-2xl font-bold" data-testid="text-profile-name">{user.name}</h1>
              <p className="text-muted-foreground text-sm">{user.friendCount} friends</p>
              {user.bio && <p className="text-sm mt-1 text-muted-foreground">{user.bio}</p>}
            </div>
            <div className="flex gap-2 sm:mb-2">
              {isMe ? (
                <Button variant="secondary" size="sm" className="gap-2 font-semibold">
                  <Pencil className="w-4 h-4" />
                  Edit profile
                </Button>
              ) : isFriend ? (
                <>
                  <Button variant="secondary" size="sm" className="gap-2 font-semibold" data-testid="button-friend-status">
                    <UserCheck className="w-4 h-4" />
                    Teman
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2 font-semibold"
                    onClick={() => setLocation(`/messages?userId=${userId}`)}
                    data-testid="button-message"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Pesan
                  </Button>
                </>
              ) : isPending ? (
                <Button variant="secondary" size="sm" disabled className="gap-2 font-semibold" data-testid="button-friend-status">
                  <UserCheck className="w-4 h-4" />
                  Permintaan Terkirim
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="gap-2 font-semibold"
                    onClick={handleAddFriend}
                    disabled={sendFriendRequest.isPending}
                    data-testid="button-add-friend"
                  >
                    <UserPlus className="w-4 h-4" />
                    Tambah Teman
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2 font-semibold"
                    onClick={() => setLocation(`/messages?userId=${userId}`)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Pesan
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-2 flex gap-2">
            <Button variant="ghost" size="sm" className="font-semibold text-muted-foreground gap-2">
              <Users className="w-4 h-4" />
              {user.friendCount} Friends
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <div className="mt-4">
        <h2 className="font-bold text-lg mb-3">Posts</h2>
        {isMe && <PostComposer />}

        {postsLoading ? (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
