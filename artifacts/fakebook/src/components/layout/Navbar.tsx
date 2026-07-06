import { Link, useLocation } from "wouter";
import { Bell, Home, Users, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetCurrentUser, useGetFeedSummary } from "@workspace/api-client-react";

export function Navbar() {
  const [location] = useLocation();
  const { data: user } = useGetCurrentUser();
  const { data: summary } = useGetFeedSummary({
    query: { refetchInterval: 5_000 },
  });

  const unreadNotifs = summary?.unreadNotifications || 0;
  const unreadMsgs = summary?.unreadMessages || 0;

  const navItems = [
    { href: "/", icon: Home },
    { href: "/friends", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b shadow-sm h-14 flex items-center px-3 justify-between gap-2">
      {/* Left */}
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/" className="text-primary-foreground font-bold text-2xl flex items-center justify-center w-10 h-10 bg-primary rounded-full select-none">
          f
        </Link>
        <div className="hidden sm:flex items-center bg-muted rounded-full px-3 py-2 w-52">
          <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search Fakebook"
            className="bg-transparent border-none outline-none text-sm w-full"
            disabled
          />
        </div>
      </div>

      {/* Center */}
      <div className="hidden md:flex items-center justify-center gap-2 flex-1 h-full">
        {navItems.map(({ href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 max-w-[120px] flex items-center justify-center h-full border-b-4 transition-colors ${
              location === href
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:bg-muted rounded-lg my-1"
            }`}
          >
            <Icon className={`w-6 h-6 ${location === href ? "fill-current" : ""}`} />
          </Link>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Messages */}
        <Link href="/messages">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full relative ${location === "/messages" ? "bg-secondary text-primary" : "bg-muted hover:bg-muted/80"}`}
          >
            <MessageCircle className="w-5 h-5" />
            {unreadMsgs > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-card">
                {unreadMsgs > 9 ? "9+" : unreadMsgs}
              </span>
            )}
          </Button>
        </Link>

        {/* Notifications */}
        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full relative ${location === "/notifications" ? "bg-secondary text-primary" : "bg-muted hover:bg-muted/80"}`}
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-destructive text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-card">
                {unreadNotifs > 9 ? "9+" : unreadNotifs}
              </span>
            )}
          </Button>
        </Link>

        {/* Avatar */}
        {user && (
          <Link href={`/profile/${user.id}`}>
            <Avatar className="w-9 h-9 border border-muted cursor-pointer hover:opacity-90 transition-opacity">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
        )}
      </div>
    </header>
  );
}
