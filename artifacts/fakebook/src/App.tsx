import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useSearch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/layout/MainLayout";
import { NotifToast } from "@/components/NotifToast";
import NotFound from "@/pages/not-found";
import Feed from "@/pages/Feed";
import Profile from "@/pages/Profile";
import Friends from "@/pages/Friends";
import Notifications from "@/pages/Notifications";
import Messages from "@/pages/Messages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 15,
      retry: 1,
    },
  },
});

function useDarkMode() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (dark: boolean) =>
      document.documentElement.classList.toggle("dark", dark);
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
}

function MessagesRoute() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const userId = params.get("userId");
  return (
    <MainLayout>
      <Messages initialUserId={userId ? Number(userId) : undefined} />
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <MainLayout>
          <Feed />
        </MainLayout>
      </Route>
      <Route path="/profile/:userId">
        {(params) => (
          <MainLayout>
            <Profile userId={Number(params.userId)} />
          </MainLayout>
        )}
      </Route>
      <Route path="/friends">
        <MainLayout>
          <Friends />
        </MainLayout>
      </Route>
      <Route path="/notifications">
        <MainLayout>
          <Notifications />
        </MainLayout>
      </Route>
      <Route path="/messages">
        <MessagesRoute />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useDarkMode();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <NotifToast />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
