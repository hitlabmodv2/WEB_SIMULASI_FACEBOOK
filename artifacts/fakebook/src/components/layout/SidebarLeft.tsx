import { Link } from "wouter";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Bookmark, PlaySquare, Clock, ChevronDown } from "lucide-react";

export function SidebarLeft() {
  const { data: user } = useGetCurrentUser();

  const links = [
    { icon: Users, label: "Friends", href: "/friends", color: "text-blue-500" },
    { icon: Clock, label: "Memories", href: "/", color: "text-purple-500" },
    { icon: Bookmark, label: "Saved", href: "/", color: "text-purple-700" },
    { icon: PlaySquare, label: "Video", href: "/", color: "text-blue-400" },
  ];

  return (
    <div className="flex flex-col gap-1 pr-2">
      {user && (
        <Link href={`/profile/${user.id}`}>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
            <Avatar className="w-9 h-9">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{user.name}</span>
          </div>
        </Link>
      )}

      {links.map((link, i) => (
        <Link key={i} href={link.href}>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
            <link.icon className={`w-7 h-7 ${link.color}`} />
            <span className="font-medium">{link.label}</span>
          </div>
        </Link>
      ))}

      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors mt-2">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ChevronDown className="w-5 h-5 text-foreground" />
        </div>
        <span className="font-medium">See more</span>
      </div>

      <div className="mt-4 pt-4 border-t px-2">
        <p className="text-xs text-muted-foreground flex flex-wrap gap-x-2 leading-loose">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Advertising</span>
          <span>Ad Choices</span>
          <span>Cookies</span>
          <span>More</span>
          <span>Meta © 2025</span>
        </p>
      </div>
    </div>
  );
}
