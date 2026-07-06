import { Router } from "express";
import { db, postsTable, usersTable, likesTable, commentsTable, notificationsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { CreatePostBody } from "@workspace/api-zod";

const router = Router();
const CURRENT_USER_ID = 1;

const REACTION_EMOJIS: Record<string, string> = {
  like: "👍", love: "❤️", haha: "😂", wow: "😮", sad: "😢", angry: "😡",
};

async function getReactions(postId: number, currentUserId: number) {
  const result = await db.execute(
    sql`SELECT reaction_type, COUNT(*) as count FROM likes WHERE post_id = ${postId} GROUP BY reaction_type`
  );
  const reactions: Record<string, number> = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
  for (const row of result.rows as { reaction_type: string; count: string }[]) {
    reactions[row.reaction_type] = Number(row.count);
  }
  const [likeRow] = await db
    .select()
    .from(likesTable)
    .where(and(eq(likesTable.postId, postId), eq(likesTable.userId, currentUserId)));
  return { reactions, userReaction: likeRow?.reactionType ?? null };
}

async function buildPost(postId: number, currentUserId: number) {
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  if (!post) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, post.userId));
  if (!user) return null;

  const likeCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM likes WHERE post_id = ${postId}`);
  const commentCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM comments WHERE post_id = ${postId}`);
  const { reactions, userReaction } = await getReactions(postId, currentUserId);

  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl ?? null,
    userId: post.userId,
    userName: user.name,
    userAvatarUrl: user.avatarUrl,
    likeCount: Number((likeCountResult.rows[0] as { count: string }).count),
    commentCount: Number((commentCountResult.rows[0] as { count: string }).count),
    shareCount: post.shareCount,
    liked: userReaction !== null,
    userReaction,
    reactions,
    createdAt: post.createdAt.toISOString(),
  };
}

router.get("/posts", async (req, res) => {
  const userId = req.query.userId ? Number(req.query.userId) : undefined;
  let query = db.select().from(postsTable).orderBy(desc(postsTable.createdAt)).$dynamic();
  if (userId) query = query.where(eq(postsTable.userId, userId));
  const posts = await query;
  const result = await Promise.all(posts.map((p) => buildPost(p.id, CURRENT_USER_ID)));
  res.json(result.filter(Boolean));
});

router.post("/posts", async (req, res) => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [post] = await db.insert(postsTable).values({
    userId: CURRENT_USER_ID,
    content: parsed.data.content,
    imageUrl: parsed.data.imageUrl ?? null,
  }).returning();
  res.status(201).json(await buildPost(post.id, CURRENT_USER_ID));
});

router.get("/posts/:postId", async (req, res) => {
  const postId = Number(req.params.postId);
  if (isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });
  const result = await buildPost(postId, CURRENT_USER_ID);
  if (!result) return res.status(404).end();
  res.json(result);
});

router.delete("/posts/:postId", async (req, res) => {
  const postId = Number(req.params.postId);
  if (isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });
  await db.delete(postsTable).where(eq(postsTable.id, postId));
  res.status(204).end();
});

router.post("/posts/:postId/like", async (req, res) => {
  const postId = Number(req.params.postId);
  if (isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

  const reactionType: string = req.body?.reactionType ?? "like";

  const [existing] = await db
    .select()
    .from(likesTable)
    .where(and(eq(likesTable.postId, postId), eq(likesTable.userId, CURRENT_USER_ID)));

  if (existing) {
    if (existing.reactionType === reactionType) {
      // Toggle off — remove reaction
      await db.delete(likesTable).where(eq(likesTable.id, existing.id));
    } else {
      // Switch reaction type
      await db.update(likesTable).set({ reactionType }).where(eq(likesTable.id, existing.id));
    }
  } else {
    await db.insert(likesTable).values({ postId, userId: CURRENT_USER_ID, reactionType });

    // Notify the post owner if not the current user
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
    if (post && post.userId !== CURRENT_USER_ID) {
      const [liker] = await db.select().from(usersTable).where(eq(usersTable.id, CURRENT_USER_ID));
      const emoji = REACTION_EMOJIS[reactionType] ?? "👍";
      await db.insert(notificationsTable).values({
        userId: post.userId,
        type: "like",
        message: `${liker?.name ?? "Someone"} reacted ${emoji} to your post.`,
        relatedPostId: postId,
        relatedUserId: CURRENT_USER_ID,
      });
    }
  }

  const { reactions, userReaction } = await getReactions(postId, CURRENT_USER_ID);
  const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM likes WHERE post_id = ${postId}`);
  res.json({
    liked: userReaction !== null,
    likeCount: Number((countResult.rows[0] as { count: string }).count),
    userReaction,
    reactions,
  });
});

export default router;
