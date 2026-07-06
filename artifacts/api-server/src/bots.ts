import { db, postsTable, usersTable, likesTable, commentsTable, notificationsTable, conversationsTable, messagesTable } from "@workspace/db";
import { eq, and, not, inArray, or } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { logger } from "./lib/logger";

const CURRENT_USER_ID = 1;
const BOT_USER_IDS = [2, 3, 4, 5, 6];
const REACTION_TYPES = ["like", "like", "like", "love", "love", "haha", "wow", "sad", "angry"] as const;

const BOT_POST_TEMPLATES = [
  "Hari ini cuacanya enak banget buat jalan-jalan. Sayang ada kerjaan 😅",
  "Abis makan siang di warung favorit. Nasi padang emang nggak ada duanya! 🍛",
  "Lagi dengerin musik sambil kerja dari rumah. Produktifitas naik 100% katanya hehe",
  "Siapa yang udah nonton film terbaru? Worth it nggak nih?",
  "Weekend plan: rebahan atau olahraga? Sepertinya rebahan menang lagi 😂",
  "Baru masak sendiri pertama kali. Hasilnya lumayan lah, asal dimakan!",
  "Morning run 5km done! Sekarang saatnya breakfast yang enak 🏃",
  "Overthinking jam 2 pagi itu nyata adanya. Ada yang relate?",
  "Lagi belajar skill baru. Susah sih tapi seru! 🚀",
  "Teman-teman, jangan lupa minum air putih yang cukup ya! 💧",
  "Gila deh macet Jakarta makin parah. Butuh WFH selamanya 🚗",
  "Netflix recommendation dong! Udah habis semua yang aku tonton 😭",
  "Kopi pagi adalah ritual wajib. Tanpa kopi = zombie 🧟",
  "Baru sadar kalau udah 3 tahun nggak ketemu teman lama. Kangen banget 😢",
  "Buka aplikasi belanja online, niat cari satu barang, 1 jam kemudian keranjang penuh 🛒",
  "Semua orang kayaknya udah ke Bali kecuali aku. Kapan ya giliran aku 🌴",
  "Abis ganti foto profil, nungguin notif like kayak anak kecil nunggu lebaran.",
  "Meeting dari pagi sampai sore, otak udah mau meledak 🧠💥",
  "Hujan di sore hari = mood terbaik buat tidur siang 💤",
  "Baru nyadar kalau udah scroll HP 3 jam tanpa sadar. Ini bahaya banget 😱",
  "Ternyata memasak itu menyenangkan kalau nggak buru-buru. Try it!",
  "Lagi pengen piknik tapi cuaca nggak mendukung. Sedih 😔",
  "Alhamdulillah hari ini selesai semua task! Akhirnya bisa napas 😤",
  "Rekomendasi podcast bagus dong! Lagi nyari hiburan pas commuting.",
  "Hari ini aku memutuskan untuk lebih positif. Wish me luck! ✨",
  "Flash sale lagi, dompet nangis lagi. Ini siklus yang nggak pernah berhenti 😂",
  "Gym pertama setelah 2 bulan absen... badan rasanya mau protes 💪😭",
  "Gawang, tiba-tiba kangen masakan ibu. Mau pulang kampung ah 🏠",
  "Ide bagus selalu datang pas mau tidur. Kenapa otak begini? 😅",
  "Ternyata beresiin kamar bisa bikin pikiran lebih lega. Coba yuk!",
  "Lagi nonton ulang series lama. Nostalgia itu beda rasanya 🥹",
  "Udah seminggu nggak olahraga, ngerasa badan berat banget. Besok mulai lagi!",
  "Work from cafe hari ini, ternyata produktif banget! ☕",
  "Kucingku ngikutin kemana-mana hari ini. Nggak mau ditinggal 🐱",
  "Tiba-tiba kangen main game bareng temen-temen lama deh.",
  "Beli buku baru tapi belum kebaca dari bulan lalu. Siapa yang relate? 📚",
];

const BOT_COMMENT_TEMPLATES = [
  "Setuju banget! 👏",
  "Wah keren nih, bisa cerita lebih?",
  "Hahaha relatable sekali!",
  "Iya bener banget, aku juga ngerasain hal yang sama.",
  "Makasih sharingnya, bermanfaat banget!",
  "Wah jadi pengen nyoba juga nih!",
  "Semangat terus ya! 💪",
  "Mantap jiwa! 🔥",
  "Ikutan dong kapan-kapan!",
  "Eh iya bener itu, aku baru tau lho!",
  "Haha aku juga gitu, kita sama!",
  "Wahh, info dong lebih lengkapnya!",
  "Keren banget, inspiratif!",
  "Ahahaha beneran deh, relate parah!",
  "Nice! Keep it up ya 😊",
  "Ini real banget sih 😭",
  "Kalau aku juga gitu tapi belum berani cerita haha",
  "Mana foto-fotonya dong?",
  "Kapan nih kita ketemuan?",
  "Lho kok mirip sama aku banget ini 😂",
  "Aku juga pengen coba nih! Thanks!",
  "Wahh iyaa, aku paling relate sama yang ini 😤",
  "Hahaha nggak nyangka ada yang juga ngerasain ini!",
  "Emang beneran gitu ya... aku paham banget deh",
  "Ini tips berguna banget, aku save dulu! 📌",
];

const BOT_REPLY_TEMPLATES = [
  "Haha iya bener banget!",
  "Sama dong, aku juga gitu 😄",
  "Makasih udah komen ya!",
  "Wah ternyata banyak yang relate!",
  "Iya kapan-kapan kita coba bareng!",
  "Hehehe iya nih 😅",
  "Beneran deh, relate banget sama ini",
  "Nah ini yang aku maksud!",
  "Iya sih, sama persis pengalaman aku!",
  "Hahaha jangan bilang gitu, jadi malu 😂",
  "Iya bener, makasih supportnya! 🙏",
  "Wah kamu juga ngerasain? Kita sama dong!",
];

const BOT_PROACTIVE_MESSAGES = [
  "Eh lagi ngapain nih? 😄",
  "Halo! Udah lama nggak chat nih 😊",
  "Hai! Gimana harimu hari ini?",
  "Btw aku baru abis nonton film bagus, rekomendasiin dong filmmu!",
  "Eh kamu udah makan belum? Jangan sampai lupa makan ya!",
  "Lagi bosen nih, ada yang mau diceritain nggak? 😁",
  "Kangen ngobrol sama kamu hehe",
  "Btw aku tadi liat postinganmu, keren banget!",
  "Hai! Hari ini gimana? Ada yang seru nggak?",
];

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function botPost(botId: number) {
  const content = randomPick(BOT_POST_TEMPLATES);
  await db.insert(postsTable).values({ userId: botId, content, imageUrl: null });
  logger.info({ botId, action: "post" }, "Bot created a post");
}

async function botReact(botId: number) {
  const alreadyLiked = await db.select({ postId: likesTable.postId }).from(likesTable).where(eq(likesTable.userId, botId));
  const likedIds = alreadyLiked.map((l) => l.postId);

  let postsQuery = db.select({ id: postsTable.id, userId: postsTable.userId }).from(postsTable).$dynamic();
  if (likedIds.length > 0) postsQuery = postsQuery.where(not(inArray(postsTable.id, likedIds)));
  const posts = await postsQuery;
  if (posts.length === 0) return;

  const target = randomPick(posts);
  const reactionType = randomPick(REACTION_TYPES);

  await db.insert(likesTable).values({ postId: target.id, userId: botId, reactionType });

  if (target.userId !== botId) {
    const [bot] = await db.select().from(usersTable).where(eq(usersTable.id, botId));
    const emoji: Record<string, string> = { like: "👍", love: "❤️", haha: "😂", wow: "😮", sad: "😢", angry: "😡" };
    await db.insert(notificationsTable).values({
      userId: target.userId,
      type: "like",
      message: `${bot?.name ?? "Someone"} reacted ${emoji[reactionType] ?? "👍"} to your post.`,
      relatedPostId: target.id,
      relatedUserId: botId,
    });
  }
  logger.info({ botId, postId: target.id, reactionType, action: "react" }, "Bot reacted to a post");
}

async function botComment(botId: number) {
  const posts = await db.select({ id: postsTable.id, userId: postsTable.userId }).from(postsTable);
  if (posts.length === 0) return;

  const target = randomPick(posts);
  const content = randomPick(BOT_COMMENT_TEMPLATES);
  await db.insert(commentsTable).values({ postId: target.id, userId: botId, content });

  if (target.userId !== botId) {
    const [bot] = await db.select().from(usersTable).where(eq(usersTable.id, botId));
    await db.insert(notificationsTable).values({
      userId: target.userId,
      type: "comment",
      message: `${bot?.name ?? "Someone"} commented on your post.`,
      relatedPostId: target.id,
      relatedUserId: botId,
    });
  }
  logger.info({ botId, postId: target.id, action: "comment" }, "Bot commented");
}

async function botReply(botId: number) {
  const topComments = await db
    .select()
    .from(commentsTable)
    .where(sql`${commentsTable.parentId} IS NULL`)
    .limit(30);
  if (topComments.length === 0) return;

  const candidates = topComments.filter((c) => c.userId !== botId);
  if (candidates.length === 0) return;

  const target = randomPick(candidates);
  const content = randomPick(BOT_REPLY_TEMPLATES);
  await db.insert(commentsTable).values({ postId: target.postId, userId: botId, parentId: target.id, content });

  if (target.userId !== botId) {
    const [bot] = await db.select().from(usersTable).where(eq(usersTable.id, botId));
    await db.insert(notificationsTable).values({
      userId: target.userId,
      type: "comment",
      message: `${bot?.name ?? "Someone"} replied to your comment.`,
      relatedPostId: target.postId,
      relatedUserId: botId,
    });
  }
  logger.info({ botId, parentCommentId: target.id, action: "reply" }, "Bot replied to comment");
}

async function botSendProactiveMessage(botId: number) {
  // Find or create conversation with Budi (user 1)
  const existing = await db
    .select()
    .from(conversationsTable)
    .where(
      or(
        and(eq(conversationsTable.user1Id, CURRENT_USER_ID), eq(conversationsTable.user2Id, botId)),
        and(eq(conversationsTable.user1Id, botId), eq(conversationsTable.user2Id, CURRENT_USER_ID))
      )
    )
    .limit(1);

  let conv = existing[0];
  if (!conv) {
    const [inserted] = await db
      .insert(conversationsTable)
      .values({ user1Id: botId, user2Id: CURRENT_USER_ID })
      .returning();
    conv = inserted;
  }

  // Don't spam — only message if last bot message was > 5 min ago
  const [lastMsg] = await db
    .select()
    .from(messagesTable)
    .where(and(eq(messagesTable.conversationId, conv.id), eq(messagesTable.senderId, botId)))
    .orderBy(sql`${messagesTable.createdAt} desc`)
    .limit(1);

  if (lastMsg) {
    const minutesSinceLast = (Date.now() - new Date(lastMsg.createdAt).getTime()) / 60000;
    if (minutesSinceLast < 5) return;
  }

  const content = randomPick(BOT_PROACTIVE_MESSAGES);
  await db.insert(messagesTable).values({ conversationId: conv.id, senderId: botId, content, read: false });
  await db.update(conversationsTable).set({ lastMessageAt: new Date() }).where(eq(conversationsTable.id, conv.id));

  logger.info({ botId, action: "proactive_message" }, "Bot sent proactive message");
}

async function botSendFriendRequest(botId: number) {
  // Check if already friends or request pending
  const { friendRequestsTable } = await import("@workspace/db");
  const existing = await db
    .select()
    .from(friendRequestsTable)
    .where(
      or(
        and(eq(friendRequestsTable.fromUserId, botId), eq(friendRequestsTable.toUserId, CURRENT_USER_ID)),
        and(eq(friendRequestsTable.fromUserId, CURRENT_USER_ID), eq(friendRequestsTable.toUserId, botId))
      )
    )
    .limit(1);

  if (existing.length > 0) return;

  const [bot] = await db.select().from(usersTable).where(eq(usersTable.id, botId));
  await db.insert(friendRequestsTable).values({ fromUserId: botId, toUserId: CURRENT_USER_ID, status: "pending" });
  await db.insert(notificationsTable).values({
    userId: CURRENT_USER_ID,
    type: "friend_request",
    message: `${bot?.name ?? "Someone"} sent you a friend request.`,
    relatedUserId: botId,
  });
  logger.info({ botId, action: "friend_request" }, "Bot sent friend request");
}

async function runBotAction() {
  try {
    const botId = randomPick(BOT_USER_IDS);
    const roll = Math.random();
    if (roll < 0.30) await botReact(botId);
    else if (roll < 0.55) await botComment(botId);
    else if (roll < 0.70) await botReply(botId);
    else if (roll < 0.82) await botPost(botId);
    else if (roll < 0.93) await botSendProactiveMessage(botId);
    else await botSendFriendRequest(botId);
  } catch (err) {
    logger.warn({ err }, "Bot action failed");
  }
}

export function startBots() {
  setTimeout(() => runBotAction(), 3_000);
  setTimeout(() => runBotAction(), 7_000);
  setTimeout(() => runBotAction(), 13_000);
  setTimeout(() => runBotAction(), 20_000);

  function scheduleNext() {
    const delay = randomInt(10_000, 22_000);
    setTimeout(async () => {
      await runBotAction();
      scheduleNext();
    }, delay);
  }
  scheduleNext();

  logger.info("Bot simulation started");
}
