import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();
const CURRENT_USER_ID = 1;

router.get("/feed/summary", async (req, res) => {
  const totalPostsResult = await db.execute(sql`SELECT COUNT(*) as count FROM posts`);
  const totalLikesResult = await db.execute(sql`SELECT COUNT(*) as count FROM likes`);
  const totalCommentsResult = await db.execute(sql`SELECT COUNT(*) as count FROM comments`);
  const unreadNotifResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${CURRENT_USER_ID} AND read = false`
  );
  const friendsResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM friend_requests WHERE (from_user_id = ${CURRENT_USER_ID} OR to_user_id = ${CURRENT_USER_ID}) AND status = 'accepted'`
  );
  const unreadMsgResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE (c.user1_id = ${CURRENT_USER_ID} OR c.user2_id = ${CURRENT_USER_ID})
          AND m.sender_id != ${CURRENT_USER_ID}
          AND m.read = false`
  );
  const trendingResult = await db.execute(
    sql`SELECT post_id, COUNT(*) as like_count FROM likes GROUP BY post_id ORDER BY like_count DESC LIMIT 1`
  );
  const trendingPostId = trendingResult.rows.length > 0
    ? Number((trendingResult.rows[0] as { post_id: number }).post_id)
    : null;

  res.json({
    totalPosts: Number((totalPostsResult.rows[0] as { count: string }).count),
    totalLikes: Number((totalLikesResult.rows[0] as { count: string }).count),
    totalComments: Number((totalCommentsResult.rows[0] as { count: string }).count),
    unreadNotifications: Number((unreadNotifResult.rows[0] as { count: string }).count),
    unreadMessages: Number((unreadMsgResult.rows[0] as { count: string }).count),
    onlineFriendsCount: Number((friendsResult.rows[0] as { count: string }).count),
    trendingPostId: trendingPostId ?? null,
  });
});

export default router;
