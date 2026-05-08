"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import AccountSwitcher from "@/components/AccountSwitcher";
import Logo from "@/components/Logo";

const desktopNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/trades", label: "Trades", icon: List },
  { href: "/analytics", label: "Analyse", icon: BarChart3 },
  { href: "/goals", label: "Ziele", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobileBottomNav = [
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Drawer schließen bei Routenwechsel
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Body-Scroll deaktivieren wenn Drawer offen
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* ============================================================
          DESKTOP SIDEBAR (immer sichtbar ab md)
          ============================================================ */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-bg-elevated border-r border-bg-border z-30">
        <SidebarBranding />
        <SidebarNav pathname={pathname} />
        <SidebarFooter
          userEmail={userEmail}
          onLogout={handleLogout}
        />
      </aside>

      {/* ============================================================
          MOBILE DRAWER (animiert von links eingeblendet)
          ============================================================ */}
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={cn(
          "md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300",
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer Sidebar */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 w-72 bg-bg-elevated border-r border-bg-border z-50 flex flex-col transition-transform duration-300 ease-out",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-bg-border">
          <SidebarBranding compact />
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-bg-card transition"
            aria-label="Menü schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarNav pathname={pathname} />
        <SidebarFooter
          userEmail={userEmail}
          onLogout={handleLogout}
        />
      </aside>

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}
      <main className="md:ml-64 pb-24 md:pb-0 min-h-screen">
        {/* MOBILE TOP BAR */}
        <header className="md:hidden sticky top-0 z-20 bg-bg-elevated/80 backdrop-blur-xl border-b border-bg-border safe-area-top">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-zinc-300 hover:text-white p-2 -ml-2 rounded-lg hover:bg-bg-card transition active:scale-95"
              aria-label="Menü öffnen"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="text-white font-semibold tracking-tight">
                GoldLedger
              </span>
            </div>
            {/* Spacer rechts für Symmetrie */}
            <div className="w-9" />
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* ============================================================
          MOBILE BOTTOM NAV
          ============================================================ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-bg-elevated/95 backdrop-blur-xl border-t border-bg-border safe-area-bottom">
        <div className="flex items-end justify-around px-2 pt-2 pb-2">
          {mobileBottomNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center -mt-7 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-xl shadow-gold-500/40 ring-4 ring-bg transition-all duration-200 group-active:scale-90 group-hover:shadow-gold-500/60">
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
                  "flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all duration-200 min-w-[60px] active:scale-95",
                  active ? "text-gold-400" : "text-zinc-500 hover:text-zinc-300"
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

/* ============================================================
   Sidebar-Bauteile — geteilt zwischen Desktop & Mobile
   ============================================================ */

function SidebarBranding({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        compact ? "" : "px-6 py-6 border-b border-bg-border"
      )}
    >
      <Logo size="md" />
      <div>
        <div className="text-white font-semibold tracking-tight leading-tight">
          GoldLedger
        </div>
        <div className="text-[11px] text-zinc-500 leading-tight">
          Trading Journal
        </div>
      </div>
    </div>
  );
}

function SidebarNav({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {desktopNav.map((item) => {
        const active =
          pathname === item.href || pathname?.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
              active
                ? "bg-gold-500/10 text-gold-400 border border-gold-500/20 shadow-sm shadow-gold-500/10"
                : "text-zinc-400 hover:text-white hover:bg-bg-card border border-transparent hover:translate-x-0.5"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 transition-transform",
                active && "scale-110"
              )}
            />
            {item.label}
            {active && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_6px_rgba(212,175,55,0.7)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({
  userEmail,
  onLogout,
}: {
  userEmail: string;
  onLogout: () => void;
}) {
  return (
    <div className="px-3 py-4 border-t border-bg-border space-y-2">
      <Link
        href="/trades/new"
        className="group flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition-all duration-200 shadow-md shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 active:translate-y-0"
      >
        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
        Neuer Trade
      </Link>

      <AccountSwitcher userEmail={userEmail} />

      <button
        onClick={onLogout}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-all duration-200 group"
      >
        <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        Abmelden
      </button>
    </div>
  );
}
