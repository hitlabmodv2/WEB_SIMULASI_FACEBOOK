import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { SidebarLeft } from "./SidebarLeft";
import { SidebarRight } from "./SidebarRight";
import { MobileNav } from "./MobileNav";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col pb-14 md:pb-0">
      <Navbar />
      <div className="flex-1 w-full max-w-[1600px] mx-auto flex justify-center">
        {/* Left Sidebar — desktop only */}
        <div className="hidden lg:block w-[360px] flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar pt-4 px-2">
          <SidebarLeft />
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-[680px] w-full px-2 sm:px-4 py-4 min-w-0">
          {children}
        </main>

        {/* Right Sidebar — large desktop only */}
        <div className="hidden xl:block w-[360px] flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar pt-4 px-2">
          <SidebarRight />
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
