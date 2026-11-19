import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/auth";
import { GateMessage, signOut, useAdminAuth } from "./auth";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: "▦", exact: true },
  { to: "/admin/insights", label: "Insights", icon: "✦", exact: false },
  { to: "/admin/media", label: "Media", icon: "🖼", exact: false },
  { to: "/admin/pages", label: "Pages & SEO", icon: "❏", exact: false },
  { to: "/admin/content", label: "Page editor", icon: "✎", exact: false },
  {
    to: "/admin/users",
    label: "Users & access",
    icon: "⚑",
    exact: false,
    owner: true,
  },
  { to: "/admin/settings", label: "Site settings", icon: "⚙", exact: false },
] as const;

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {role}
    </span>
  );
}

export function AdminLayout() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const auth = useAdminAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!mounted) return null;
  if (auth.status !== "ok")
    return (
      <div className="flex min-h-screen items-start justify-center bg-muted px-4">
        <GateMessage state={auth} />
      </div>
    );

  const nav = NAV.filter((n) => !("owner" in n) || auth.user.role === "owner");
  const current = nav.find((n) =>
    n.exact ? pathname === n.to : pathname.startsWith(n.to),
  );

  return (
    <div className="flex min-h-screen bg-muted text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card px-4 py-6 md:flex">
        <a href="/" className="flex items-baseline gap-2 px-2">
          <span className="text-lg font-semibold tracking-tight">LEX ARTA</span>
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            admin
          </span>
        </a>
        <nav className="mt-8 flex flex-1 flex-col gap-1 text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              activeProps={{
                className:
                  "flex items-center gap-3 rounded-lg px-3 py-2 bg-primary/10 font-semibold text-primary",
              }}
            >
              <span
                aria-hidden
                className="w-4 text-center text-base leading-none"
              >
                {n.icon}
              </span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-foreground">Signed in</p>
            <RoleBadge role={auth.user.role} />
          </div>
          <p className="mt-0.5 truncate" title={auth.user.email}>
            {auth.user.name || auth.user.email}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <a href="/" className="text-xs text-primary underline">
            View site ↗
          </a>
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-card/80 px-5 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              LEX ARTA admin
            </p>
            <h2 className="truncate text-sm font-semibold">
              {current?.label ?? "Dashboard"}
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b bg-card px-2 py-2 text-sm md:hidden">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-muted-foreground"
              activeProps={{
                className:
                  "whitespace-nowrap rounded-lg px-3 py-1.5 bg-primary/10 font-semibold text-primary",
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-6xl flex-1 p-5 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
