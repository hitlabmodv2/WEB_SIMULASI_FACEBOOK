import { useQueryClient } from "@tanstack/react-query";
import {
  useListFriends,
  useListUsers,
  useSendFriendRequest,
  useRespondFriendRequest,
  getListFriendsQueryKey,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { UserPlus, UserCheck, UserX, Users } from "lucide-react";

function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  );
}

export default function Friends() {
  const queryClient = useQueryClient();
  const { data: friendsData, isLoading: friendsLoading } = useListFriends({
    query: { queryKey: getListFriendsQueryKey() },
  });
  const { data: allUsers, isLoading: usersLoading } = useListUsers({
    query: { queryKey: getListUsersQueryKey() },
  });
  const sendFriendRequest = useSendFriendRequest();
  const respondFriendRequest = useRespondFriendRequest();

  const friends = friendsData?.friends || [];
  const pendingRequests = friendsData?.pendingRequests || [];

  const friendIds = new Set(friends.map((f) => f.id));
  const pendingToIds = new Set(pendingRequests.map((r) => r.fromUserId));

  const suggestions = (allUsers || []).filter(
    (u) => !u.isCurrentUser && !friendIds.has(u.id) && !pendingToIds.has(u.id)
  );

  function handleAccept(requestId: number) {
    respondFriendRequest.mutate(
      { requestId, data: { action: "accept" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        },
      }
    );
  }

  function handleReject(requestId: number) {
    respondFriendRequest.mutate(
      { requestId, data: { action: "reject" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
        },
      }
    );
  }

  function handleAdd(userId: number) {
    sendFriendRequest.mutate(
      { data: { toUserId: userId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        },
      }
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending Requests */}
      {(pendingRequests.length > 0 || friendsLoading) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <h2 className="font-bold text-lg">Friend Requests</h2>
            <p className="text-sm text-muted-foreground">{pendingRequests.length} pending</p>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {friendsLoading ? (
              <>
                <UserCardSkeleton />
                <UserCardSkeleton />
              </>
            ) : (
              pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`card-friend-request-${req.id}`}
                >
                  <Link href={`/profile/${req.fromUserId}`}>
                    <Avatar className="w-14 h-14 cursor-pointer">
                      <AvatarImage src={req.fromUserAvatarUrl} alt={req.fromUserName} />
                      <AvatarFallback>{req.fromUserName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/profile/${req.fromUserId}`}>
                      <p className="font-semibold text-sm hover:underline cursor-pointer">{req.fromUserName}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">Sent you a friend request</p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="font-semibold gap-1"
                        onClick={() => handleAccept(req.id)}
                        disabled={respondFriendRequest.isPending}
                        data-testid={`button-accept-${req.id}`}
                      >
                        <UserCheck className="w-4 h-4" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="font-semibold gap-1"
                        onClick={() => handleReject(req.id)}
                        disabled={respondFriendRequest.isPending}
                        data-testid={`button-reject-${req.id}`}
                      >
                        <UserX className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* People You May Know */}
      {suggestions.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <h2 className="font-bold text-lg">People You May Know</h2>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {usersLoading ? (
              <>
                <UserCardSkeleton />
                <UserCardSkeleton />
                <UserCardSkeleton />
              </>
            ) : (
              suggestions.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`card-suggestion-${user.id}`}
                >
                  <Link href={`/profile/${user.id}`}>
                    <Avatar className="w-14 h-14 cursor-pointer">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/profile/${user.id}`}>
                      <p className="font-semibold text-sm hover:underline cursor-pointer">{user.name}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">{user.friendCount} mutual friends</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1 font-semibold flex-shrink-0"
                    onClick={() => handleAdd(user.id)}
                    disabled={sendFriendRequest.isPending}
                    data-testid={`button-add-friend-${user.id}`}
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Friend
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Friends */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <h2 className="font-bold text-lg">Friends</h2>
          <p className="text-sm text-muted-foreground">{friends.length} friends</p>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          {friendsLoading ? (
            <>
              <UserCardSkeleton />
              <UserCardSkeleton />
            </>
          ) : friends.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No friends yet. Start by sending some requests!</p>
            </div>
          ) : (
            friends.map((friend) => (
              <Link key={friend.id} href={`/profile/${friend.id}`}>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  data-testid={`card-friend-${friend.id}`}
                >
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={friend.avatarUrl} alt={friend.name} />
                    <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{friend.name}</p>
                    <p className="text-xs text-muted-foreground">{friend.friendCount} friends</p>
                  </div>
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
