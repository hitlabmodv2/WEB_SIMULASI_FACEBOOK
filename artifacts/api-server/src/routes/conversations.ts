import { Router } from "express";
import { db, conversationsTable, messagesTable, usersTable, friendRequestsTable } from "@workspace/db";
import { eq, and, or, desc, lt, sql } from "drizzle-orm";
import { z } from "zod";

const CURRENT_USER_ID = 1;
const router = Router();

// Cover avatars for users
const COVER_URLS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800",
];

async function formatUser(userId: number, currentUserId: number) {
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    avatarUrl: u.avatarUrl,
    coverUrl: u.coverUrl ?? COVER_URLS[0],
    bio: u.bio ?? null,
    friendCount: 0,
    postCount: 0,
    isCurrentUser: u.id === currentUserId,
    friendshipStatus: null,
  };
}

// GET /conversations
router.get("/conversations", async (req, res) => {
  const convos = await db
    .select()
    .from(conversationsTable)
    .where(
      or(
        eq(conversationsTable.user1Id, CURRENT_USER_ID),
        eq(conversationsTable.user2Id, CURRENT_USER_ID)
      )
    )
    .orderBy(desc(conversationsTable.lastMessageAt));

  const result = await Promise.all(
    convos.map(async (c) => {
      const otherId = c.user1Id === CURRENT_USER_ID ? c.user2Id : c.user1Id;
      const otherUser = await formatUser(otherId, CURRENT_USER_ID);

      // last message
      const [lastMsg] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, c.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);

      // unread count (messages sent to current user that are unread)
      const [{ count }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.conversationId, c.id),
            eq(messagesTable.senderId, otherId),
            eq(messagesTable.read, false)
          )
        );

      return {
        id: c.id,
        otherUser,
        lastMessage: lastMsg?.content ?? null,
        lastMessageSenderId: lastMsg?.senderId ?? null,
        unreadCount: count ?? 0,
        createdAt: c.createdAt.toISOString(),
        lastMessageAt: c.lastMessageAt.toISOString(),
      };
    })
  );

  res.json(result);
});

// POST /conversations — get or create
router.post("/conversations", async (req, res) => {
  const body = z.object({ toUserId: z.number().int() }).parse(req.body);
  const { toUserId } = body;

  // find existing
  const existing = await db
    .select()
    .from(conversationsTable)
    .where(
      or(
        and(eq(conversationsTable.user1Id, CURRENT_USER_ID), eq(conversationsTable.user2Id, toUserId)),
        and(eq(conversationsTable.user1Id, toUserId), eq(conversationsTable.user2Id, CURRENT_USER_ID))
      )
    )
    .limit(1);

  let conv = existing[0];
  if (!conv) {
    const [inserted] = await db
      .insert(conversationsTable)
      .values({ user1Id: CURRENT_USER_ID, user2Id: toUserId })
      .returning();
    conv = inserted;
  }

  const otherId = conv.user1Id === CURRENT_USER_ID ? conv.user2Id : conv.user1Id;
  const otherUser = await formatUser(otherId, CURRENT_USER_ID);
  const [lastMsg] = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conv.id))
    .orderBy(desc(messagesTable.createdAt))
    .limit(1);

  res.json({
    id: conv.id,
    otherUser,
    lastMessage: lastMsg?.content ?? null,
    lastMessageSenderId: lastMsg?.senderId ?? null,
    unreadCount: 0,
    createdAt: conv.createdAt.toISOString(),
    lastMessageAt: conv.lastMessageAt.toISOString(),
  });
});

// GET /conversations/:id/messages
router.get("/conversations/:conversationId/messages", async (req, res) => {
  const convId = parseInt(req.params.conversationId);
  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, convId))
    .orderBy(messagesTable.createdAt);

  const senderIds = [...new Set(msgs.map((m) => m.senderId))];
  const senderMap: Record<number, { name: string; avatarUrl: string }> = {};
  await Promise.all(
    senderIds.map(async (id) => {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, id));
      if (u) senderMap[id] = { name: u.name, avatarUrl: u.avatarUrl };
    })
  );

  res.json(
    msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: senderMap[m.senderId]?.name ?? "Unknown",
      senderAvatarUrl: senderMap[m.senderId]?.avatarUrl ?? "",
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      read: m.read,
    }))
  );
});

// POST /conversations/:id/messages — send a message, triggers bot reply
router.post("/conversations/:conversationId/messages", async (req, res) => {
  const convId = parseInt(req.params.conversationId);
  const body = z.object({ content: z.string().min(1) }).parse(req.body);

  // Verify conversation belongs to current user
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, convId));
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const otherId = conv.user1Id === CURRENT_USER_ID ? conv.user2Id : conv.user1Id;

  // Insert user's message
  const [msg] = await db
    .insert(messagesTable)
    .values({ conversationId: convId, senderId: CURRENT_USER_ID, content: body.content, read: true })
    .returning();

  // Update last_message_at
  await db
    .update(conversationsTable)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversationsTable.id, convId));

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, CURRENT_USER_ID));

  // Schedule bot auto-reply
  const delay = 1500 + Math.random() * 3000;
  setTimeout(async () => {
    try {
      const [bot] = await db.select().from(usersTable).where(eq(usersTable.id, otherId));
      if (!bot) return;
      const reply = generateBotReply(bot.name, body.content);
      await db.insert(messagesTable).values({
        conversationId: convId,
        senderId: otherId,
        content: reply,
        read: false,
      });
      await db
        .update(conversationsTable)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversationsTable.id, convId));
    } catch (_) {}
  }, delay);

  res.status(201).json({
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: sender?.name ?? "Budi",
    senderAvatarUrl: sender?.avatarUrl ?? "",
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
    read: msg.read,
  });
});

// PATCH /conversations/:id/read
router.patch("/conversations/:conversationId/read", async (req, res) => {
  const convId = parseInt(req.params.conversationId);
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, convId));
  if (!conv) return res.status(404).json({ error: "Not found" });
  const otherId = conv.user1Id === CURRENT_USER_ID ? conv.user2Id : conv.user1Id;
  await db
    .update(messagesTable)
    .set({ read: true })
    .where(and(eq(messagesTable.conversationId, convId), eq(messagesTable.senderId, otherId)));
  res.json({ ok: true });
});

// ————————————————————————————————————————————
// Smart bot reply generator
// ————————————————————————————————————————————
function generateBotReply(botName: string, msg: string): string {
  const m = msg.toLowerCase();
  const firstName = botName.split(" ")[0];

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Greetings
  if (/^(halo|hai|hi|hello|hey|hei|hy|p|ping|selamat pagi|selamat siang|selamat malam|pagi|siang|malam|assalamu|salam)/.test(m)) {
    return pick([
      `Halo juga! Apa kabar? 😊`,
      `Hai! Lagi ngapain nih? 😄`,
      `Heyyy, halo! Kangen juga nih 😁`,
      `Hei hei! Kabar baik kan? 🙌`,
      `Wah, ${firstName === botName ? "kamu" : "Budi"}! Hai! Lagi santai nih 😎`,
    ]);
  }

  // How are you
  if (/apa kabar|gimana kabar|kabar|how are|how r u|baik-baik/.test(m)) {
    return pick([
      "Alhamdulillah baik! Kamu sendiri gimana? 😊",
      "Baik banget nih, makasih udah nanya! Kamu gimana? 🙏",
      "Lumayan, lagi agak sibuk tapi oke kok. Kamu baik-baik aja kan?",
      "Baik dong! Btw aku tadi lagi mikirin kamu 😄 kabar kamu?",
    ]);
  }

  // Food
  if (/makan|makanan|lapar|warung|resto|restoran|nasi|ayam|soto|bakso|mie|pizza|burger|kopi|sarapan|minum/.test(m)) {
    return pick([
      "Jangan sebut makanan ah, aku jadi lapar beneran 😭",
      "Wah lagi ngomongin makanan nih! Favorit aku nasi padang, kamu?",
      "Ih aku juga lagi pengen makan! Kayaknya nanti mau pesan online deh 😋",
      "Makanan tuh memang solusi semua masalah hidup 🍜",
      "Udah makan belum? Kalau belum, jangan sampai skip ya!",
    ]);
  }

  // Work / bored
  if (/kerja|kerjaan|bosan|boring|gabut|nganggur|deadline|tugas|kuliah|sekolah|kantor/.test(m)) {
    return pick([
      "Ih sama! Aku juga lagi gabut banget nih 😅",
      "Kerja mulu capek, tapi nggak kerja nggak ada duit 😂 relate nggak?",
      "Deadline itu nyata adanya, semangat ya! 💪",
      "Istirahat dulu dong, jangan terlalu dipaksain 🙏",
      "Nggak kerja dulu, chat aku aja 😂",
    ]);
  }

  // Lonely / sad
  if (/sedih|kangen|rindu|lonely|kesepian|nangis|galau|patah hati/.test(m)) {
    return pick([
      "Ih kenapa sedih? Cerita dong, aku dengerin kok 🥺",
      "Kangen siapa nih? Hehe. Semangat ya, aku di sini 😊",
      "Galau jangan sendirian, cerita sama aku 💙",
      "Sabar ya, semua pasti ada solusinya. Kamu nggak sendirian kok!",
    ]);
  }

  // Happy / excited
  if (/senang|happy|bahagia|seru|asik|keren|mantap|gila|gilaa|wow|waw|amazing|bagus|cakep/.test(m)) {
    return pick([
      "Wahh aku ikut seneng! Cerita dong lebih lengkapnya 🎉",
      "Asiik banget! Semoga terus bahagia ya! 😄",
      "Hahaha iya keren banget! Kapan nih giliran aku? 😂",
      "Keren! Foto dongg, aku mau liat 😍",
    ]);
  }

  // Plans / hangout
  if (/kapan|ketemuan|jalan|hangout|main|meetup|weekend|liburan|traveling|trip|wisata/.test(m)) {
    return pick([
      "Asik banget! Aku mau ikut dong kalau ada kesempatan 😄",
      "Kapan nih kita ketemuan? Udah lama nggak ngobrol langsung!",
      "Weekend ini lagi ada rencana? Kayaknya seru kalau ketemuan 🙌",
      "Ajak aku dong! Aku lagi pengen jalan-jalan juga nih 🌴",
    ]);
  }

  // Complain / vent
  if (/capek|lelah|stress|pusing|ribet|susah|susah banget|mager|males|malas/.test(m)) {
    return pick([
      "Istirahat dulu yuk, jangan dipaksain terus 😌",
      "Iya ih, aku juga ngerasain hal yang sama belakangan ini 😮‍💨",
      "Semangat! Habis susah pasti ada enaknya kok 💪",
      "Mager club, aku juga anggota aktif 😂",
    ]);
  }

  // Questions to bot
  if (/kamu|lo|lu|elo|kamu lagi|lagi apa|ngapain|suka apa|hobi/.test(m)) {
    return pick([
      "Aku lagi santai nih, scrolling sosmed sambil dengerin musik 🎵",
      "Lagi mikirin mau makan apa sore ini haha. Kamu?",
      "Hobi aku suka baca dan nonton film! Kamu suka apa?",
      "Aku lagi pengen jalan-jalan sebenernya, tapi males keluar 😂",
      "Aku baik-baik aja nih, lagi santai. Kamu butuh sesuatu?",
    ]);
  }

  // Love / relationship
  if (/cinta|sayang|suka|gebetan|pacar|jomblo|single|relationship/.test(m)) {
    return pick([
      "Wah ngomongin cinta nih 👀 ada yang spesial?",
      "Hahaha jomblo merdeka katanya! Tapi kangen juga sih 😂",
      "Semoga cepet ketemu yang cocok ya! 🙏",
      "Eh itu orang siapa? Cerita dong! 😏",
    ]);
  }

  // Thanks
  if (/makasih|terima kasih|thanks|thank you|thx/.test(m)) {
    return pick([
      "Sama-sama! 😊 Kalau butuh apa-apa hubungi aku ya!",
      "Tentu! Senang bisa bantu 🙏",
      "Santai aja, buat kamu mah beres! 😄",
      "Hehe iya, nggak usah sungkan ya!",
    ]);
  }

  // Jokes / fun
  if (/haha|hihi|huhu|wkwk|lol|lucu|ngakak|ketawa|bercanda/.test(m)) {
    return pick([
      "Hahaha iya lucu banget 😂",
      "Wkwkwk beneran ngakak ini 🤣",
      "Ih kamu lucu deh! Mana lagi ceritanya?",
      "Hahaha aku sampe sempet lupa balas karena ketawa 😂",
    ]);
  }

  // Default fallback — varied and natural
  return pick([
    "Haha iya bener juga sih 😄 gimana lagi ceritanya?",
    "Wah menarik nih, cerita lebih dong!",
    "Iya iya aku dengerin kok 😊 terus?",
    "Eh beneran? Seru banget kayaknya!",
    "Hmmm aku ngerti maksudnya 🤔 emang agak complicated ya",
    "Haha setuju! Kita emang sefrekuensi 😄",
    "Noted! Makasih udah cerita ya 🙏",
    "Wahh iya sih, aku juga pernah ngerasain gitu",
    "Ooh gitu, interesting! Lanjut dong ceritanya",
    "Hehe bener juga 😁 eh ngomong-ngomong, kamu udah makan belum?",
    "Aku setuju banget sama itu! Kapan-kapan harus dicoba nih",
    "Sip deh! Semangat terus ya 💪",
  ]);
}

export default router;
