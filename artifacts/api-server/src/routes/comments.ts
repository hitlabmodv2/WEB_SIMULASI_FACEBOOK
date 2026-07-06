import { Router } from "express";
import { db, commentsTable, usersTable, postsTable, notificationsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { CreateCommentBody } from "@workspace/api-zod";

const router = Router();
const CURRENT_USER_ID = 1;

async function buildComment(c: typeof commentsTable.$inferSelect, allComments: typeof commentsTable.$inferSelect[], users: Map<number, typeof usersTable.$inferSelect>) {
  const user = users.get(c.userId);
  const replies = allComments
    .filter((r) => r.parentId === c.id)
    .map((r) => {
      const ru = users.get(r.userId);
      return {
        id: r.id,
        postId: r.postId,
        userId: r.userId,
        userName: ru?.name ?? "Unknown",
        userAvatarUrl: ru?.avatarUrl ?? "",
        content: r.content,
        parentId: r.parentId ?? null,
        createdAt: r.createdAt.toISOString(),
        replies: [],
      };
    });
  return {
    id: c.id,
    postId: c.postId,
    userId: c.userId,
    userName: user?.name ?? "Unknown",
    userAvatarUrl: user?.avatarUrl ?? "",
    content: c.content,
    parentId: c.parentId ?? null,
    createdAt: c.createdAt.toISOString(),
    replies,
  };
}

router.get("/posts/:postId/comments", async (req, res) => {
  const postId = Number(req.params.postId);
  if (isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

  const allComments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.postId, postId))
    .orderBy(asc(commentsTable.createdAt));

  if (allComments.length === 0) return res.json([]);

  const userIds = [...new Set(allComments.map((c) => c.userId))];
  const allUsers = await db.select().from(usersTable);
  const usersMap = new Map(allUsers.map((u) => [u.id, u]));

  // Only return top-level comments (parentId is null); replies are nested inside
  const topLevel = allComments.filter((c) => !c.parentId);
  const result = topLevel.map((c) => buildComment(c, allComments, usersMap));
  res.json(result);
});

router.post("/posts/:postId/comments", async (req, res) => {
  const postId = Number(req.params.postId);
  if (isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const parentId = req.body.parentId ? Number(req.body.parentId) : null;

  const [comment] = await db.insert(commentsTable).values({
    postId,
    userId: CURRENT_USER_ID,
    parentId: parentId ?? undefined,
    content: parsed.data.content,
  }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, CURRENT_USER_ID));

  // Notify the post owner (only for top-level comments)
  if (!parentId) {
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
    if (post && post.userId !== CURRENT_USER_ID) {
      await db.insert(notificationsTable).values({
        userId: post.userId,
        type: "comment",
        message: `${user?.name ?? "Someone"} commented on your post.`,
        relatedPostId: postId,
        relatedUserId: CURRENT_USER_ID,
      });
    }
  } else {
    // Notify the parent comment author if it's not the current user
    const [parentComment] = await db.select().from(commentsTable).where(eq(commentsTable.id, parentId));
    if (parentComment && parentComment.userId !== CURRENT_USER_ID) {
      await db.insert(notificationsTable).values({
        userId: parentComment.userId,
        type: "comment",
        message: `${user?.name ?? "Someone"} replied to your comment.`,
        relatedPostId: postId,
        relatedUserId: CURRENT_USER_ID,
      });
    }
  }

  res.status(201).json({
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    userName: user?.name ?? "Unknown",
    userAvatarUrl: user?.avatarUrl ?? "",
    content: comment.content,
    parentId: comment.parentId ?? null,
    createdAt: comment.createdAt.toISOString(),
    replies: [],
  });
});

router.delete("/posts/:postId/comments/:commentId", async (req, res) => {
  const commentId = Number(req.params.commentId);
  if (isNaN(commentId)) return res.status(400).json({ error: "Invalid commentId" });
  await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
  res.status(204).end();
});

export default router;
