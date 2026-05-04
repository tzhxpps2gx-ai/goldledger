"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  List,
  Plus,
  Settings,
  LogOut,
  BarChart3,
  Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const desktopNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/trades", label: "Trades", icon: List },
  { href: "/analytics", label: "Analyse", icon: BarChart3 },
  { href: "/goals", label: "Ziele", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobileNav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/trades/new", label: "Neu", icon: Plus, primary: true },
  { href: "/trades", label: "Trades", icon: List },
  { href: "/analytics", label: "Analyse", icon: BarChart3 },
];

export default function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* ============ DESKTOP SIDEBAR ============ */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-bg-elevated border-r border-bg-border z-30">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-bg-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-md shadow-gold-500/20">
            <span className="text-base font-bold text-bg">G</span>
          </div>
          <div>
            <div className="text-white font-semibold tracking-tight leading-tight">
              GoldLedger
            </div>
            <div className="text-[11px] text-zinc-500 leading-tight">
              Trading Journal
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {desktopNav.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
                  active
                    ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-bg-card border border-transparent"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-bg-border">
          <Link
            href="/trades/new"
            className="flex items-center justify-center gap-2 w-full py-2.5 mb-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition shadow-md shadow-gold-500/20"
          >
            <Plus className="w-4 h-4" />
            Neuer Trade
          </Link>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-bg-card border border-bg-border flex items-center justify-center text-xs font-semibold text-gold-400">
              {userEmail?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-zinc-500 leading-tight">
                Eingeloggt als
              </div>
              <div className="text-xs text-white truncate leading-tight">
                {userEmail}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-danger transition p-1.5 rounded-lg hover:bg-danger/10"
              aria-label="Abmelden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <main className="md:ml-64 pb-24 md:pb-0 min-h-screen">
        {/* MOBILE TOP BAR */}
        <header className="md:hidden sticky top-0 z-20 bg-bg-elevated/80 backdrop-blur-xl border-b border-bg-border safe-area-top">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-md shadow-gold-500/20">
                <span className="text-sm font-bold text-bg">G</span>
              </div>
              <span className="text-white font-semibold tracking-tight">
                GoldLedger
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-danger p-2 rounded-lg transition"
              aria-label="Abmelden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* ============ MOBILE BOTTOM NAV ============ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-bg-elevated/95 backdrop-blur-xl border-t border-bg-border safe-area-bottom">
        <div className="flex items-end justify-around px-2 pt-2 pb-2">
          {mobileNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center -mt-7"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-xl shadow-gold-500/40 ring-4 ring-bg">
                    <Icon className="w-6 h-6 text-bg" strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1.5 font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition min-w-[60px]",
                  active ? "text-gold-400" : "text-zinc-500"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
