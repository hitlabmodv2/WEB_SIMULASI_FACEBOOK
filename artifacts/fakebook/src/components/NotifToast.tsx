import { useEffect, useRef, useState } from "react";
import { useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";

interface ToastNotif {
  id: number;
  message: string;
  type: string;
  relatedUserAvatarUrl?: string | null;
  relatedUserName?: string | null;
  createdAt: string;
}

const TYPE_EMOJI: Record<string, string> = {
  like: "👍", comment: "💬", share: "↗️",
  friend_request: "👤", friend_accept: "🤝",
};

function getEmoji(type: string, message: string) {
  if (type === "like") {
    if (message.includes("❤️")) return "❤️";
    if (message.includes("😂")) return "😂";
    if (message.includes("😮")) return "😮";
    if (message.includes("😢")) return "😢";
    if (message.includes("😡")) return "😡";
  }
  return TYPE_EMOJI[type] ?? "🔔";
}

export function NotifToast() {
  const [toasts, setToasts] = useState<ToastNotif[]>([]);
  const seenIds = useRef<Set<number>>(new Set());
  const initialized = useRef(false);

  const { data: notifications } = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      refetchInterval: 8_000,
    },
  });

  useEffect(() => {
    if (!notifications) return;

    if (!initialized.current) {
      // On first load, mark all current notifications as "already seen"
      notifications.forEach((n) => seenIds.current.add(n.id));
      initialized.current = true;
      return;
    }

    const newOnes = notifications.filter((n) => !seenIds.current.has(n.id));
    if (newOnes.length === 0) return;

    newOnes.forEach((n) => seenIds.current.add(n.id));

    const newToasts: ToastNotif[] = newOnes.slice(0, 3).map((n) => ({
      id: n.id,
      message: n.message,
      type: n.type,
      relatedUserAvatarUrl: (n as any).relatedUserAvatarUrl ?? null,
      relatedUserName: (n as any).relatedUserName ?? null,
      createdAt: n.createdAt,
    }));

    setToasts((prev) => [...newToasts, ...prev].slice(0, 4));

    // Auto-dismiss each after 5s
    newToasts.forEach((t) => {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 5_000);
    });
  }, [notifications]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-3 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-1.5rem)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-card border shadow-lg rounded-xl p-3 flex items-start gap-3 animate-in slide-in-from-right-4 fade-in duration-200"
        >
          <div className="relative flex-shrink-0">
            <Avatar className="w-10 h-10">
              <AvatarImage src={toast.relatedUserAvatarUrl ?? undefined} alt={toast.relatedUserName ?? ""} />
              <AvatarFallback>{toast.relatedUserName?.charAt(0) ?? "?"}</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 text-base leading-none">
              {getEmoji(toast.type, toast.message)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">{toast.message}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Baru saja</p>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== toast.id))}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
