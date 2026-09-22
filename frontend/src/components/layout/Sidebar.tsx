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

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/daily", label: "Daily", icon: Sun },
  { href: "/weekly", label: "Weekly", icon: CalWeek },
  { href: "/monthly", label: "Monthly", icon: CalendarRange },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

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
