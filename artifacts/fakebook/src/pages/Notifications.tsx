import { useQueryClient } from "@tanstack/react-query";
import {
  useListNotifications,
  useMarkNotificationRead,
  getListNotificationsQueryKey,
  getGetFeedSummaryQueryKey,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck } from "lucide-react";

const TYPE_META: Record<string, { emoji: string; bg: string }> = {
  like: { emoji: "👍", bg: "bg-blue-500" },
  love: { emoji: "❤️", bg: "bg-red-500" },
  haha: { emoji: "😂", bg: "bg-yellow-500" },
  wow: { emoji: "😮", bg: "bg-yellow-500" },
  sad: { emoji: "😢", bg: "bg-yellow-500" },
  angry: { emoji: "😡", bg: "bg-orange-500" },
  comment: { emoji: "💬", bg: "bg-green-500" },
  share: { emoji: "↗️", bg: "bg-purple-500" },
  friend_request: { emoji: "👤", bg: "bg-blue-400" },
  friend_accept: { emoji: "🤝", bg: "bg-blue-400" },
};

function getTypeMeta(type: string, message: string) {
  // detect reaction type from message emoji
  if (type === "like") {
    if (message.includes("❤️")) return TYPE_META.love;
    if (message.includes("😂")) return TYPE_META.haha;
    if (message.includes("😮")) return TYPE_META.wow;
    if (message.includes("😢")) return TYPE_META.sad;
    if (message.includes("😡")) return TYPE_META.angry;
  }
  return TYPE_META[type] ?? { emoji: "🔔", bg: "bg-muted-foreground" };
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

interface Notif {
  id: number; type: string; message: string; read: boolean;
  relatedUserAvatarUrl?: string | null; relatedUserName?: string | null;
  relatedPostId?: number | null; createdAt: string;
}

function NotifRow({ notif, onClick }: { notif: Notif; onClick?: () => void }) {
  const meta = getTypeMeta(notif.type, notif.message);
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${notif.read ? "hover:bg-muted/50" : "bg-secondary/40 hover:bg-secondary/60"}`}
      onClick={onClick}
      data-testid={`notification-${notif.id}`}
    >
      {/* Avatar with reaction badge */}
      <div className="relative flex-shrink-0">
        <Avatar className="w-14 h-14">
          <AvatarImage src={notif.relatedUserAvatarUrl ?? undefined} alt={notif.relatedUserName ?? ""} />
          <AvatarFallback className="text-lg">
            {notif.relatedUserName ? notif.relatedUserName.charAt(0) : "?"}
          </AvatarFallback>
        </Avatar>
        <span className={`absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-sm ${meta.bg} border-2 border-card`}>
          {meta.emoji}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${notif.read ? "text-muted-foreground" : "font-medium text-foreground"}`}>
          {notif.message}
        </p>
        <p className={`text-xs mt-0.5 ${notif.read ? "text-muted-foreground" : "text-primary font-semibold"}`}>
          {timeAgo(notif.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.read && <span className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></span>}
    </div>
  );
}

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      refetchInterval: 8_000,
    },
  });
  const markRead = useMarkNotificationRead();

  function handleMarkRead(id: number) {
    markRead.mutate({ notificationId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFeedSummaryQueryKey() });
      },
    });
  }

  function handleMarkAllRead() {
    const unread = (notifications ?? []).filter((n) => !n.read);
    unread.forEach((n) => markRead.mutate({ notificationId: n.id }));
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetFeedSummaryQueryKey() });
    }, 500);
  }

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;
  const unread = (notifications ?? []).filter((n) => !n.read);
  const read = (notifications ?? []).filter((n) => n.read);

  return (
    <div>
      <Card className="shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl">Notifikasi</h1>
            {unreadCount > 0 && <p className="text-sm text-muted-foreground">{unreadCount} baru</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-primary font-semibold gap-2" onClick={handleMarkAllRead} data-testid="button-mark-all-read">
              <CheckCheck className="w-4 h-4" />
              Tandai semua dibaca
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-2 pb-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada notifikasi</p>
              <p className="text-sm mt-1">Notifikasi like, komentar, dan permintaan teman akan muncul di sini.</p>
            </div>
          ) : (
            <>
              {unread.length > 0 && (
                <>
                  <p className="px-4 pt-2 pb-1 text-sm font-bold text-foreground">Baru</p>
                  {unread.map((n) => (
                    <NotifRow key={n.id} notif={n as Notif} onClick={() => handleMarkRead(n.id)} />
                  ))}
                </>
              )}
              {read.length > 0 && (
                <>
                  <p className="px-4 pt-4 pb-1 text-sm font-bold text-foreground">Sebelumnya</p>
                  {read.map((n) => (
                    <NotifRow key={n.id} notif={n as Notif} />
                  ))}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
