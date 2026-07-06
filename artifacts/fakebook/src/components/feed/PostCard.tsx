import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  useToggleLike,
  useListComments,
  useCreateComment,
  useDeletePost,
  useGetCurrentUser,
  getListPostsQueryKey,
  getListCommentsQueryKey,
  getGetFeedSummaryQueryKey,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Share2, MoreHorizontal, Trash2, CornerDownRight } from "lucide-react";

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Like", color: "text-blue-500" },
  { type: "love", emoji: "❤️", label: "Love", color: "text-red-500" },
  { type: "haha", emoji: "😂", label: "Haha", color: "text-yellow-500" },
  { type: "wow", emoji: "😮", label: "Wow", color: "text-yellow-500" },
  { type: "sad", emoji: "😢", label: "Sad", color: "text-yellow-500" },
  { type: "angry", emoji: "😡", label: "Angry", color: "text-orange-500" },
] as const;

type ReactionType = (typeof REACTIONS)[number]["type"];

const REACTION_MAP = Object.fromEntries(REACTIONS.map((r) => [r.type, r])) as Record<
  ReactionType,
  (typeof REACTIONS)[number]
>;

interface Reactions {
  like?: number; love?: number; haha?: number; wow?: number; sad?: number; angry?: number;
}

interface Comment {
  id: number; postId: number; userId: number; userName: string; userAvatarUrl: string;
  content: string; parentId?: number | null; createdAt: string;
  replies?: Comment[];
}

interface Post {
  id: number; content: string; imageUrl?: string | null;
  userId: number; userName: string; userAvatarUrl: string;
  likeCount: number; commentCount: number; shareCount: number;
  liked: boolean; userReaction?: string | null; reactions?: Reactions;
  createdAt: string;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
  return `${Math.floor(diff / 86400)}h`;
}

function ReactionSummary({ reactions, likeCount }: { reactions?: Reactions; likeCount: number }) {
  if (!likeCount || likeCount === 0) return null;
  const sorted = Object.entries(reactions ?? {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-1">
        {sorted.map(([type]) => (
          <span key={type} className="text-sm w-5 h-5 rounded-full bg-card flex items-center justify-center shadow-sm text-[13px]">
            {REACTION_MAP[type as ReactionType]?.emoji ?? "👍"}
          </span>
        ))}
      </div>
      <span>{likeCount}</span>
    </div>
  );
}

function ReactionPicker({ onReact, currentReaction }: { onReact: (type: string) => void; currentReaction?: string | null }) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-card border rounded-full shadow-lg px-2 py-1.5 flex gap-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
      {REACTIONS.map((r) => (
        <button
          key={r.type}
          onClick={() => onReact(r.type)}
          title={r.label}
          className={`text-2xl hover:scale-125 transition-transform duration-100 ${currentReaction === r.type ? "scale-110 drop-shadow-md" : ""}`}
        >
          {r.emoji}
        </button>
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  depth = 0,
  onReply,
  replyingTo,
}: {
  comment: Comment;
  depth?: number;
  onReply: (commentId: number, userName: string) => void;
  replyingTo: number | null;
}) {
  return (
    <div className={depth > 0 ? "ml-10" : ""}>
      <div className="flex gap-2 items-start" data-testid={`comment-${comment.id}`}>
        <Link href={`/profile/${comment.userId}`}>
          <Avatar className="w-8 h-8 flex-shrink-0 cursor-pointer mt-0.5">
            <AvatarImage src={comment.userAvatarUrl} alt={comment.userName} />
            <AvatarFallback>{comment.userName?.charAt(0) ?? "?"}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-muted rounded-2xl px-3 py-2 inline-block max-w-full">
            <Link href={`/profile/${comment.userId}`}>
              <span className="font-semibold text-xs hover:underline cursor-pointer block">{comment.userName}</span>
            </Link>
            <p className="text-sm break-words">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-0.5 pl-1">
            <span className="text-[11px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
            {depth === 0 && (
              <button
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                onClick={() => onReply(comment.id, comment.userName)}
              >
                <CornerDownRight className="w-3 h-3" />
                Balas
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={1} onReply={onReply} replyingTo={replyingTo} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PostCard({ post }: { post: Post }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useGetCurrentUser();
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();
  const createComment = useCreateComment();
  const { data: comments, isLoading: commentsLoading } = useListComments(post.id, {
    query: { enabled: showComments, queryKey: getListCommentsQueryKey(post.id) },
  });

  const currentReaction = post.userReaction ?? null;
  const activeReaction = REACTION_MAP[currentReaction as ReactionType];

  function handleReact(reactionType: string) {
    setShowReactionPicker(false);
    toggleLike.mutate(
      { postId: post.id, data: { reactionType } } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFeedSummaryQueryKey() });
        },
      }
    );
  }

  function handleLikeClick() {
    if (currentReaction) {
      handleReact(currentReaction); // toggle off same reaction
    } else {
      handleReact("like");
    }
  }

  function handleDelete() {
    deletePost.mutate({ postId: post.id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() }),
    });
  }

  function handleComment() {
    if (!commentText.trim()) return;
    const payload: any = { postId: post.id, data: { content: commentText.trim() } };
    if (replyingTo) payload.data.parentId = replyingTo.id;
    createComment.mutate(payload, {
      onSuccess: () => {
        setCommentText("");
        setReplyingTo(null);
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(post.id) });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      },
    });
  }

  function startReply(commentId: number, userName: string) {
    setReplyingTo({ id: commentId, name: userName });
    setShowComments(true);
    setTimeout(() => document.getElementById(`comment-input-${post.id}`)?.focus(), 100);
  }

  return (
    <Card className="mb-4 shadow-sm" data-testid={`card-post-${post.id}`}>
      <CardContent className="pt-4 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${post.userId}`}>
              <Avatar className="w-10 h-10 cursor-pointer hover:opacity-90 transition-opacity">
                <AvatarImage src={post.userAvatarUrl} alt={post.userName} />
                <AvatarFallback>{post.userName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/profile/${post.userId}`}>
                <span className="font-semibold text-sm hover:underline cursor-pointer" data-testid={`text-post-author-${post.id}`}>
                  {post.userName}
                </span>
              </Link>
              <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {currentUser?.id === post.userId && (
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm mb-3 leading-relaxed" data-testid={`text-post-content-${post.id}`}>{post.content}</p>

        {post.imageUrl && (
          <div className="rounded-lg overflow-hidden mb-3 -mx-4">
            <img src={post.imageUrl} alt="Post" className="w-full object-cover max-h-[500px]" />
          </div>
        )}

        {/* Reaction + count summary */}
        {(post.likeCount > 0 || post.commentCount > 0) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 pb-2 border-b">
            <ReactionSummary reactions={post.reactions} likeCount={post.likeCount} />
            <div className="flex gap-3">
              {post.commentCount > 0 && (
                <button className="hover:underline" onClick={() => setShowComments(true)}>
                  {post.commentCount} komentar
                </button>
              )}
              {post.shareCount > 0 && (
                <span>{post.shareCount} dibagikan</span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1">
          {/* Reaction button with hover picker */}
          <div
            className="flex-1 relative"
            onMouseEnter={() => { hoverTimer.current = setTimeout(() => setShowReactionPicker(true), 500); }}
            onMouseLeave={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setShowReactionPicker(false); }}
          >
            {showReactionPicker && (
              <ReactionPicker onReact={handleReact} currentReaction={currentReaction} />
            )}
            <Button
              variant="ghost"
              className={`w-full gap-1.5 font-semibold text-sm h-9 ${activeReaction ? activeReaction.color : "text-muted-foreground"}`}
              onClick={handleLikeClick}
              disabled={toggleLike.isPending}
              data-testid={`button-like-${post.id}`}
            >
              <span className="text-base leading-none">{activeReaction?.emoji ?? "👍"}</span>
              <span>{activeReaction?.label ?? "Like"}</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            className={`flex-1 gap-2 font-semibold text-sm h-9 text-muted-foreground ${showComments ? "text-primary" : ""}`}
            onClick={() => setShowComments(!showComments)}
            data-testid={`button-comment-${post.id}`}
          >
            <MessageSquare className="w-5 h-5" />
            Komentar
          </Button>

          <Button
            variant="ghost"
            className="flex-1 gap-2 font-semibold text-sm h-9 text-muted-foreground"
            data-testid={`button-share-${post.id}`}
          >
            <Share2 className="w-5 h-5" />
            Bagikan
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 border-t pt-3">
            {commentsLoading ? (
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                    <Skeleton className="h-10 flex-1 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 mb-3">
                {(comments as unknown as Comment[])?.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} depth={0} onReply={startReply} replyingTo={replyingTo?.id ?? null} />
                ))}
                {(!comments || comments.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-2">Belum ada komentar. Jadilah yang pertama!</p>
                )}
              </div>
            )}

            {/* Reply indicator */}
            {replyingTo && (
              <div className="flex items-center gap-2 mb-2 px-1 text-xs text-primary">
                <CornerDownRight className="w-3 h-3" />
                <span>Membalas <strong>{replyingTo.name}</strong></span>
                <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setReplyingTo(null)}>✕</button>
              </div>
            )}

            {/* Comment Input */}
            <div className="flex gap-2 items-center">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={currentUser?.avatarUrl} />
                <AvatarFallback>{currentUser?.name?.charAt(0) ?? "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea
                  id={`comment-input-${post.id}`}
                  data-testid={`input-comment-${post.id}`}
                  placeholder={replyingTo ? `Balas ${replyingTo.name}...` : "Tulis komentar..."}
                  className="resize-none rounded-full bg-muted border-none text-sm py-2 px-4 min-h-0 h-9 leading-5 focus-visible:ring-1 flex-1"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                />
                <Button
                  size="sm"
                  onClick={handleComment}
                  disabled={!commentText.trim() || createComment.isPending}
                  data-testid={`button-submit-comment-${post.id}`}
                >
                  Kirim
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
