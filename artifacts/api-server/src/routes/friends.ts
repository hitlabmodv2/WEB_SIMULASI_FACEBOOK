import { Router } from "express";
import { db, friendRequestsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, or, and, sql } from "drizzle-orm";
import { SendFriendRequestBody, RespondFriendRequestBody } from "@workspace/api-zod";

const router = Router();
const CURRENT_USER_ID = 1;

async function buildUserSummary(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return null;
  const friendCountResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM friend_requests WHERE (from_user_id = ${userId} OR to_user_id = ${userId}) AND status = 'accepted'`
  );
  const postCountResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM posts WHERE user_id = ${userId}`
  );
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    bio: user.bio ?? null,
    friendCount: Number((friendCountResult.rows[0] as { count: string }).count),
    postCount: Number((postCountResult.rows[0] as { count: string }).count),
    isCurrentUser: userId === CURRENT_USER_ID,
    friendshipStatus: "accepted" as string | null,
  };
}

router.get("/friends", async (req, res) => {
  const acceptedRequests = await db
    .select()
    .from(friendRequestsTable)
    .where(
      and(
        or(
          eq(friendRequestsTable.fromUserId, CURRENT_USER_ID),
          eq(friendRequestsTable.toUserId, CURRENT_USER_ID)
        ),
        eq(friendRequestsTable.status, "accepted")
      )
    );

  const friends = await Promise.all(
    acceptedRequests.map(async (req) => {
      const friendId = req.fromUserId === CURRENT_USER_ID ? req.toUserId : req.fromUserId;
      return buildUserSummary(friendId);
    })
  );

  const pendingRequests = await db
    .select()
    .from(friendRequestsTable)
    .where(
      and(
        eq(friendRequestsTable.toUserId, CURRENT_USER_ID),
        eq(friendRequestsTable.status, "pending")
      )
    );

  const pendingWithUsers = await Promise.all(
    pendingRequests.map(async (req) => {
      const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.fromUserId));
      return {
        id: req.id,
        fromUserId: req.fromUserId,
        toUserId: req.toUserId,
        fromUserName: fromUser?.name ?? "Unknown",
        fromUserAvatarUrl: fromUser?.avatarUrl ?? "",
        status: req.status,
        createdAt: req.createdAt.toISOString(),
      };
    })
  );

  res.json({
    friends: friends.filter(Boolean),
    pendingRequests: pendingWithUsers,
  });
});

router.post("/friends", async (req, res) => {
  const parsed = SendFriendRequestBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { toUserId } = parsed.data;

  // Check if already exists
  const [existing] = await db
    .select()
    .from(friendRequestsTable)
    .where(
      or(
        and(eq(friendRequestsTable.fromUserId, CURRENT_USER_ID), eq(friendRequestsTable.toUserId, toUserId)),
        and(eq(friendRequestsTable.fromUserId, toUserId), eq(friendRequestsTable.toUserId, CURRENT_USER_ID))
      )
    );

  if (existing) return res.status(409).json({ error: "Friend request already exists" });

  const [request] = await db.insert(friendRequestsTable).values({
    fromUserId: CURRENT_USER_ID,
    toUserId,
  }).returning();

  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, CURRENT_USER_ID));

  // Notify the recipient
  await db.insert(notificationsTable).values({
    userId: toUserId,
    type: "friend_request",
    message: `${fromUser?.name ?? "Someone"} sent you a friend request.`,
    relatedUserId: CURRENT_USER_ID,
  });

  res.status(201).json({
    id: request.id,
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
    fromUserName: fromUser?.name ?? "Unknown",
    fromUserAvatarUrl: fromUser?.avatarUrl ?? "",
    status: request.status,
    createdAt: request.createdAt.toISOString(),
  });
});

router.patch("/friends/:requestId", async (req, res) => {
  const requestId = Number(req.params.requestId);
  if (isNaN(requestId)) return res.status(400).json({ error: "Invalid requestId" });

  const parsed = RespondFriendRequestBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { action } = parsed.data;
  const newStatus = action === "accept" ? "accepted" : "rejected";

  const [updated] = await db
    .update(friendRequestsTable)
    .set({ status: newStatus })
    .where(eq(friendRequestsTable.id, requestId))
    .returning();

  if (!updated) return res.status(404).json({ error: "Request not found" });

  if (action === "accept") {
    const [accepter] = await db.select().from(usersTable).where(eq(usersTable.id, CURRENT_USER_ID));
    await db.insert(notificationsTable).values({
      userId: updated.fromUserId,
      type: "friend_accept",
      message: `${accepter?.name ?? "Someone"} accepted your friend request.`,
      relatedUserId: CURRENT_USER_ID,
    });
  }

  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, updated.fromUserId));
  res.json({
    id: updated.id,
    fromUserId: updated.fromUserId,
    toUserId: updated.toUserId,
    fromUserName: fromUser?.name ?? "Unknown",
    fromUserAvatarUrl: fromUser?.avatarUrl ?? "",
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
