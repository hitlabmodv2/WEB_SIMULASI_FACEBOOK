import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListConversations,
  useGetOrCreateConversation,
  useListMessages,
  useSendMessage,
  useMarkConversationRead,
  useListUsers,
  getListConversationsQueryKey,
  getListMessagesQueryKey,
  getGetFeedSummaryQueryKey,
  useGetCurrentUser,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageCircle, ArrowLeft, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENT_USER_ID = 1;

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
  return `${Math.floor(diff / 86400)}h`;
}

interface Convo {
  id: number;
  otherUser: { id: number; name: string; avatarUrl: string };
  lastMessage?: string | null;
  lastMessageSenderId?: number | null;
  unreadCount: number;
  lastMessageAt: string;
}

interface Msg {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl: string;
  content: string;
  createdAt: string;
  read: boolean;
}

function ConversationList({
  convos,
  loading,
  activeId,
  onSelect,
  onNewChat,
}: {
  convos: Convo[];
  loading: boolean;
  activeId: number | null;
  onSelect: (c: Convo) => void;
  onNewChat: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">Pesan</h1>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onNewChat} title="Pesan baru">
          <UserPlus className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3 items-center p-2">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : convos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground px-4">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">Belum ada pesan</p>
            <p className="text-xs mt-1">Mulai percakapan dengan teman-temanmu!</p>
          </div>
        ) : (
          convos.map((c) => (
            <button
              key={c.id}
              className={cn(
                "w-full flex items-center gap-3 p-3 hover:bg-muted/60 transition-colors text-left",
                activeId === c.id && "bg-primary/10"
              )}
              onClick={() => onSelect(c)}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={c.otherUser.avatarUrl} alt={c.otherUser.name} />
                  <AvatarFallback>{c.otherUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", c.unreadCount > 0 ? "font-bold" : "font-medium")}>
                    {c.otherUser.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-1">{timeAgo(c.lastMessageAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-xs truncate", c.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {c.lastMessageSenderId === CURRENT_USER_ID ? "Kamu: " : ""}
                    {c.lastMessage ?? "Mulai percakapan"}
                  </p>
                  {c.unreadCount > 0 && (
                    <span className="flex-shrink-0 bg-primary text-primary-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function ChatView({
  convo,
  onBack,
}: {
  convo: Convo;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: currentUser } = useGetCurrentUser();
  const { data: messages, isLoading } = useListMessages(convo.id, {
    query: {
      queryKey: getListMessagesQueryKey(convo.id),
      refetchInterval: 3_000,
    },
  });
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();

  // Mark as read when opening
  useEffect(() => {
    if (convo.unreadCount > 0) {
      markRead.mutate({ conversationId: convo.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFeedSummaryQueryKey() });
        },
      });
    }
  }, [convo.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  function handleSend() {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    sendMessage.mutate(
      { conversationId: convo.id, data: { content } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(convo.id) });
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
      }
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b">
        <button className="md:hidden p-1 rounded-full hover:bg-muted" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={convo.otherUser.avatarUrl} alt={convo.otherUser.name} />
            <AvatarFallback>{convo.otherUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        </div>
        <div>
          <p className="font-semibold text-sm">{convo.otherUser.name}</p>
          <p className="text-[11px] text-green-500 font-medium">● Aktif sekarang</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("flex gap-2", i % 2 === 0 ? "justify-end" : "justify-start")}>
                {i % 2 !== 0 && <Skeleton className="w-8 h-8 rounded-full" />}
                <Skeleton className={cn("h-10 rounded-2xl", i % 2 === 0 ? "w-48" : "w-36")} />
              </div>
            ))}
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <Avatar className="w-20 h-20 mb-3">
              <AvatarImage src={convo.otherUser.avatarUrl} alt={convo.otherUser.name} />
              <AvatarFallback className="text-2xl">{convo.otherUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-foreground">{convo.otherUser.name}</p>
            <p className="text-sm mt-1">Mulai percakapan dengan salam! 👋</p>
          </div>
        ) : (
          <>
            {(messages as unknown as Msg[]).map((msg, i) => {
              const isMe = msg.senderId === CURRENT_USER_ID;
              const prev = (messages as unknown as Msg[])[i - 1];
              const showAvatar = !isMe && (!prev || prev.senderId !== msg.senderId);
              return (
                <div key={msg.id} className={cn("flex gap-2 items-end", isMe ? "justify-end" : "justify-start")}>
                  {!isMe && (
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={msg.senderAvatarUrl} alt={msg.senderName} />
                          <AvatarFallback className="text-xs">{msg.senderName.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}
                  <div className={cn("max-w-[70%] group", isMe ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "px-3 py-2 rounded-2xl text-sm break-words",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {timeAgo(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2 items-center">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.name ?? "Me"} />
          <AvatarFallback>{currentUser?.name?.charAt(0) ?? "B"}</AvatarFallback>
        </Avatar>
        <Input
          placeholder="Aa"
          className="rounded-full bg-muted border-none focus-visible:ring-1 flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          autoFocus
        />
        <Button
          size="icon"
          className="rounded-full w-9 h-9 flex-shrink-0"
          onClick={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function NewChatModal({ onClose, onStart }: { onClose: () => void; onStart: (userId: number) => void }) {
  const { data: users } = useListUsers({ query: {} });
  const others = (users ?? []).filter((u) => !u.isCurrentUser);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <Card className="w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <CardContent className="pt-4 pb-2">
          <h3 className="font-bold text-base mb-3">Pesan Baru</h3>
          <p className="text-xs text-muted-foreground mb-2">Pilih orang untuk dikirimi pesan:</p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {others.map((u) => (
              <button
                key={u.id}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => { onStart(u.id); onClose(); }}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={u.avatarUrl} alt={u.name} />
                  <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{u.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Messages({ initialUserId }: { initialUserId?: number }) {
  const queryClient = useQueryClient();
  const [activeConvo, setActiveConvo] = useState<Convo | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const getOrCreate = useGetOrCreateConversation();

  const { data: convos, isLoading } = useListConversations({
    query: {
      queryKey: getListConversationsQueryKey(),
      refetchInterval: 5_000,
    },
  });

  // If an initial user is specified (e.g. clicking Message on a profile), open that conversation
  useEffect(() => {
    if (initialUserId) {
      handleStartChat(initialUserId);
    }
  }, [initialUserId]);

  function handleStartChat(userId: number) {
    getOrCreate.mutate(
      { data: { toUserId: userId } },
      {
        onSuccess: (newConvo: any) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setActiveConvo(newConvo);
        },
      }
    );
  }

  const list = (convos ?? []) as unknown as Convo[];

  return (
    <div className="h-[calc(100vh-120px)] flex rounded-xl overflow-hidden border bg-card shadow-sm">
      {/* Left panel: conversation list */}
      <div className={cn("w-full md:w-80 border-r flex-shrink-0", activeConvo ? "hidden md:flex flex-col" : "flex flex-col")}>
        <ConversationList
          convos={list}
          loading={isLoading}
          activeId={activeConvo?.id ?? null}
          onSelect={(c) => setActiveConvo(c)}
          onNewChat={() => setShowNewChat(true)}
        />
      </div>

      {/* Right panel: chat view */}
      <div className={cn("flex-1 flex flex-col", !activeConvo ? "hidden md:flex items-center justify-center" : "flex flex-col")}>
        {activeConvo ? (
          <ChatView
            key={activeConvo.id}
            convo={activeConvo}
            onBack={() => setActiveConvo(null)}
          />
        ) : (
          <div className="text-center text-muted-foreground">
            <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p className="font-semibold">Pilih percakapan</p>
            <p className="text-sm mt-1">atau mulai pesan baru</p>
            <Button className="mt-4 gap-2" onClick={() => setShowNewChat(true)}>
              <UserPlus className="w-4 h-4" />
              Pesan Baru
            </Button>
          </div>
        )}
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onStart={handleStartChat}
        />
      )}
    </div>
  );
}
