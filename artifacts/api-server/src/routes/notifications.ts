import { Router } from "express";
import { db, notificationsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();
const CURRENT_USER_ID = 1;

async function buildNotification(n: typeof notificationsTable.$inferSelect) {
  let relatedUserName: string | null = null;
  let relatedUserAvatarUrl: string | null = null;

  if (n.relatedUserId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, n.relatedUserId));
    relatedUserName = user?.name ?? null;
    relatedUserAvatarUrl = user?.avatarUrl ?? null;
  }

  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    message: n.message,
    read: n.read,
    relatedPostId: n.relatedPostId ?? null,
    relatedUserId: n.relatedUserId ?? null,
    relatedUserName,
    relatedUserAvatarUrl,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", async (req, res) => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, CURRENT_USER_ID))
    .orderBy(desc(notificationsTable.createdAt));

  const result = await Promise.all(notifications.map(buildNotification));
  res.json(result);
});

router.patch("/notifications/:notificationId/read", async (req, res) => {
  const notificationId = Number(req.params.notificationId);
  if (isNaN(notificationId)) return res.status(400).json({ error: "Invalid notificationId" });

  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, notificationId))
    .returning();

  if (!updated) return res.status(404).json({ error: "Notification not found" });
  res.json(await buildNotification(updated));
});

export default router;
