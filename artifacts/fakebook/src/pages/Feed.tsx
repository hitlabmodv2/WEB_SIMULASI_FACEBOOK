import { useListPosts, getListPostsQueryKey } from "@workspace/api-client-react";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function PostSkeleton() {
  return (
    <Card className="mb-4 shadow-sm">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <div className="flex gap-2 pt-2 border-t">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Feed() {
  const { data: posts, isLoading } = useListPosts(undefined, {
    query: { queryKey: getListPostsQueryKey(), refetchInterval: 10_000 },
  });

  return (
    <div>
      <PostComposer />

      {isLoading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts && posts.length > 0 ? (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm mt-1">Be the first to share something!</p>
        </div>
      )}
    </div>
  );
}
