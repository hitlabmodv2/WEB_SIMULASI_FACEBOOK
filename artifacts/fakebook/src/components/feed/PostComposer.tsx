import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetCurrentUser, useCreatePost, getListPostsQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Video, Smile } from "lucide-react";

export function PostComposer() {
  const [content, setContent] = useState("");
  const { data: user } = useGetCurrentUser();
  const createPost = useCreatePost();
  const queryClient = useQueryClient();

  function handleSubmit() {
    if (!content.trim()) return;
    createPost.mutate(
      { data: { content: content.trim() } },
      {
        onSuccess: () => {
          setContent("");
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        },
      }
    );
  }

  return (
    <Card className="mb-4 shadow-sm">
      <CardContent className="pt-3 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.avatarUrl} alt={user?.name} />
            <AvatarFallback>{user?.name?.charAt(0) ?? "U"}</AvatarFallback>
          </Avatar>
          <Textarea
            data-testid="input-post-content"
            placeholder={`What's on your mind, ${user?.name?.split(" ")[0] ?? "Friend"}?`}
            className="resize-none rounded-full bg-muted border-none text-sm py-2 px-4 min-h-0 h-10 leading-6 focus-visible:ring-1"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>
        <div className="border-t pt-2 flex items-center justify-between">
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 text-sm font-semibold">
              <Video className="w-5 h-5 text-red-500" />
              Live video
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 text-sm font-semibold">
              <Image className="w-5 h-5 text-green-500" />
              Photo/video
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 text-sm font-semibold">
              <Smile className="w-5 h-5 text-yellow-500" />
              Feeling
            </Button>
          </div>
          <Button
            data-testid="button-submit-post"
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || createPost.isPending}
            className="font-semibold"
          >
            Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
