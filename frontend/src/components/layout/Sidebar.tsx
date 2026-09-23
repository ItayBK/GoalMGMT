"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sun,
  Calendar as CalWeek,
  CalendarRange,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  Target,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { pageCache } from "@/lib/cache";
import type { Mission, MissionLog, Frequency } from "@/types";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, frequency: null },
  { href: "/daily", label: "Daily", icon: Sun, frequency: "daily" as Frequency },
  { href: "/weekly", label: "Weekly", icon: CalWeek, frequency: "weekly" as Frequency },
  { href: "/monthly", label: "Monthly", icon: CalendarRange, frequency: "monthly" as Frequency },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, frequency: null },
  { href: "/reports", label: "Reports", icon: BarChart3, frequency: null },
  { href: "/settings", label: "Settings", icon: Settings, frequency: null },
];

/** Return the period start date string for a given frequency. */
function getPeriodStart(frequency: Frequency): string {
  const today = new Date();
  const yyyy = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  if (frequency === "daily") return yyyy(today);
  if (frequency === "weekly") {
    const day = today.getDay();
    const diff = today.getDate() - day;
    const sunday = new Date(today);
    sunday.setDate(diff);
    return yyyy(sunday);
  }
  // monthly
  return yyyy(new Date(today.getFullYear(), today.getMonth(), 1));
}

/** Return the period end date string for a given frequency. */
function getPeriodEnd(frequency: Frequency): string {
  const today = new Date();
  const yyyy = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  if (frequency === "daily") return yyyy(today);
  if (frequency === "weekly") {
    const day = today.getDay();
    const diff = today.getDate() - day;
    const sunday = new Date(today);
    sunday.setDate(diff);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    return yyyy(saturday);
  }
  // monthly
  return yyyy(new Date(today.getFullYear(), today.getMonth() + 1, 0));
}

/**
 * Fire a background fetch for a mission section if the cache is empty.
 * Called on hover so data is already warm by the time the user clicks.
 */
async function prefetchMissionPage(frequency: Frequency) {
  const periodStart = getPeriodStart(frequency);
  const cacheKey = `missions-page-${frequency}-${periodStart}`;
  if (pageCache.get(cacheKey)) return; // already cached — nothing to do

  const periodEnd = getPeriodEnd(frequency);
  try {
    const [missionsRes, logsRes] = await Promise.all([
      api.get<Mission[]>(`/missions/?frequency=${frequency}`),
      api.get<MissionLog[]>(`/logs/?start=${periodStart}&end=${periodEnd}`),
    ]);
    pageCache.set(cacheKey, { missions: missionsRes.data, logs: logsRes.data });
  } catch {
    // Prefetch failures are silent — the page will just fetch normally on navigation.
  }
}

async function prefetchDashboard() {
  const DASHBOARD_CACHE_KEY = "dashboard-page-data";
  if (pageCache.get(DASHBOARD_CACHE_KEY)) return;

  const db = getPeriodStart("daily");
  const wb = getPeriodStart("weekly");
  const mb = getPeriodStart("monthly");

  const dbEnd = getPeriodEnd("daily");
  const wbEnd = getPeriodEnd("weekly");
  const mbEnd = getPeriodEnd("monthly");

  try {
    const [dm, dl, wm, wl, mm, ml, rep] = await Promise.all([
      api.get<Mission[]>("/missions/?frequency=daily"),
      api.get<MissionLog[]>(`/logs/?start=${db}&end=${dbEnd}`),
      api.get<Mission[]>("/missions/?frequency=weekly"),
      api.get<MissionLog[]>(`/logs/?start=${wb}&end=${wbEnd}`),
      api.get<Mission[]>("/missions/?frequency=monthly"),
      api.get<MissionLog[]>(`/logs/?start=${mb}&end=${mbEnd}`),
      api.get<any[]>("/reports/?limit=1"),
    ]);
    pageCache.set(DASHBOARD_CACHE_KEY, {
      dm: dm.data, dl: dl.data,
      wm: wm.data, wl: wl.data,
      mm: mm.data, ml: ml.data,
      rep: rep.data[0] || null
    });
  } catch {}
}

async function prefetchCalendar() {
  const today = new Date();
  const yyyy = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  const startOfMonth = yyyy(new Date(today.getFullYear(), today.getMonth(), 1));
  const endOfMonth = yyyy(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const cacheKey = `calendar-page-data-${startOfMonth}`;

  if (pageCache.get(cacheKey)) return;
  try {
    const [m, l] = await Promise.all([
      api.get<Mission[]>("/missions/"),
      api.get<MissionLog[]>(`/logs/?start=${startOfMonth}&end=${endOfMonth}`),
    ]);
    pageCache.set(cacheKey, { missions: m.data, logs: l.data });
  } catch {}
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 flex flex-col border-r border-[rgba(var(--color-border),0.5)] bg-[rgba(var(--color-surface),0.5)] backdrop-blur-xl z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[rgba(var(--color-border),0.3)]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-accent))] flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-accent))] bg-clip-text text-transparent">
          GoalMGMT
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => {
                if (item.frequency) prefetchMissionPage(item.frequency);
                else if (item.href === "/calendar") prefetchCalendar();
                else if (item.href === "/") prefetchDashboard();
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[rgba(var(--color-primary),0.15)] text-[rgb(var(--color-primary-light))] shadow-[0_0_20px_rgba(var(--color-primary),0.1)]"
                  : "text-[rgb(var(--color-text-muted))] hover:bg-[rgba(var(--color-surface-hover),0.6)] hover:text-[rgb(var(--color-text))]"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-[rgba(var(--color-border),0.3)]">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))] flex items-center justify-center text-xs font-bold text-white uppercase">
            {user?.email?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[rgb(var(--color-text-muted))] truncate">
              {user?.email || "Loading..."}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm text-[rgb(var(--color-text-dim))] hover:text-[rgb(var(--color-danger))] hover:bg-[rgba(var(--color-danger),0.1)] transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
