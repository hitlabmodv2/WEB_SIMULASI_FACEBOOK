import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { postsTable } from "./posts";

export const REACTION_TYPES = ["like", "love", "haha", "wow", "sad", "angry"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export const likesTable = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  postId: integer("post_id").notNull().references(() => postsTable.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull().default("like"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.postId)]);

export type Like = typeof likesTable.$inferSelect;
