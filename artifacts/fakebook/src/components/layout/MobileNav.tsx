import { Link, useLocation } from "wouter";
import { Home, Users, Bell, MessageCircle } from "lucide-react";
import { useGetFeedSummary } from "@workspace/api-client-react";

export function MobileNav() {
  const [location] = useLocation();
  const { data: summary } = useGetFeedSummary({
    query: { refetchInterval: 5_000 },
  });
  const unreadNotifs = summary?.unreadNotifications || 0;
  const unreadMsgs = summary?.unreadMessages || 0;

  const tabs = [
    { href: "/", icon: Home, label: "Beranda" },
    { href: "/friends", icon: Users, label: "Teman" },
    { href: "/messages", icon: MessageCircle, label: "Pesan", badge: unreadMsgs },
    { href: "/notifications", icon: Bell, label: "Notifikasi", badge: unreadNotifs },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex items-stretch h-14">
      {tabs.map(({ href, icon: Icon, label, badge }) => {
        const active = location === href;
        return (
          <Link key={href} href={href} className="flex-1">
            <div className={`flex flex-col items-center justify-center h-full gap-0.5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
              <div className="relative">
                <Icon className={`w-6 h-6 ${active ? "fill-current" : ""}`} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-destructive text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
