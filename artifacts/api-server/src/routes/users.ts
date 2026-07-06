import { Router } from "express";
import { db, usersTable, friendRequestsTable } from "@workspace/db";
import { eq, or, and, sql } from "drizzle-orm";

const router = Router();
const CURRENT_USER_ID = 1;

async function buildUser(userId: number, currentUserId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return null;

  const friendCountResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM friend_requests WHERE (from_user_id = ${userId} OR to_user_id = ${userId}) AND status = 'accepted'`
  );
  const postCountResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM posts WHERE user_id = ${userId}`
  );

  const friendCount = Number((friendCountResult.rows[0] as { count: string }).count);
  const postCount = Number((postCountResult.rows[0] as { count: string }).count);

  let friendshipStatus: string | null = null;
  if (userId !== currentUserId) {
    const [req] = await db
      .select()
      .from(friendRequestsTable)
      .where(
        or(
          and(eq(friendRequestsTable.fromUserId, currentUserId), eq(friendRequestsTable.toUserId, userId)),
          and(eq(friendRequestsTable.fromUserId, userId), eq(friendRequestsTable.toUserId, currentUserId))
        )
      );
    if (req) friendshipStatus = req.status;
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    bio: user.bio ?? null,
    friendCount,
    postCount,
    isCurrentUser: userId === currentUserId,
    friendshipStatus,
  };
}

router.get("/users", async (req, res) => {
  const users = await db.select().from(usersTable);
  const result = await Promise.all(users.map((u) => buildUser(u.id, CURRENT_USER_ID)));
  res.json(result.filter(Boolean));
});

router.get("/users/me", async (req, res) => {
  const user = await buildUser(CURRENT_USER_ID, CURRENT_USER_ID);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

router.get("/users/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "Invalid userId" });
  const user = await buildUser(userId, CURRENT_USER_ID);
  if (!user) return res.status(404).end();
  res.json(user);
});

export default router;
