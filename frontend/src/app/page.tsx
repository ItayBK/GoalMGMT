"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sun,
  Calendar,
  CalendarRange,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Target,
} from "lucide-react";
import api from "@/lib/api";
import type { Mission, MissionLog, AIReport } from "@/types";
import toast from "react-hot-toast";

function getPeriodBounds(frequency: "daily" | "weekly" | "monthly") {
  const today = new Date();
  const yyyy = (d: Date) => d.toISOString().split("T")[0];
  if (frequency === "daily") return { start: yyyy(today), end: yyyy(today) };
  if (frequency === "weekly") {
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(today);
    mon.setDate(diff);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { start: yyyy(mon), end: yyyy(sun) };
  }
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: yyyy(start), end: yyyy(end) };
}

export default function DashboardPage() {
  const [dailyMissions, setDailyMissions] = useState<Mission[]>([]);
  const [dailyLogs, setDailyLogs] = useState<MissionLog[]>([]);
  const [weeklyMissions, setWeeklyMissions] = useState<Mission[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<MissionLog[]>([]);
  const [monthlyMissions, setMonthlyMissions] = useState<Mission[]>([]);
  const [monthlyLogs, setMonthlyLogs] = useState<MissionLog[]>([]);
  const [latestReport, setLatestReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const db = getPeriodBounds("daily");
        const wb = getPeriodBounds("weekly");
        const mb = getPeriodBounds("monthly");
        const [dm, dl, wm, wl, mm, ml, rep] = await Promise.all([
          api.get<Mission[]>("/missions/?frequency=daily"),
          api.get<MissionLog[]>(`/logs/?start=${db.start}&end=${db.end}`),
          api.get<Mission[]>("/missions/?frequency=weekly"),
          api.get<MissionLog[]>(`/logs/?start=${wb.start}&end=${wb.end}`),
          api.get<Mission[]>("/missions/?frequency=monthly"),
          api.get<MissionLog[]>(`/logs/?start=${mb.start}&end=${mb.end}`),
          api.get<AIReport[]>("/reports/?limit=1"),
        ]);
        setDailyMissions(dm.data);
        setDailyLogs(dl.data);
        setWeeklyMissions(wm.data);
        setWeeklyLogs(wl.data);
        setMonthlyMissions(mm.data);
        setMonthlyLogs(ml.data);
        setLatestReport(rep.data[0] || null);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function calcProgress(missions: Mission[], logs: MissionLog[]) {
    if (missions.length === 0) return { completed: 0, total: 0, pct: 0 };
    const logMap = Object.fromEntries(logs.map((l) => [l.mission_id, l]));
    const completed = missions.filter((m) => logMap[m.id]?.is_completed).length;
    return {
      completed,
      total: missions.length,
      pct: Math.round((completed / missions.length) * 100),
    };
  }

  const daily = calcProgress(dailyMissions, dailyLogs);
  const weekly = calcProgress(weeklyMissions, weeklyLogs);
  const monthly = calcProgress(monthlyMissions, monthlyLogs);
  const overall = {
    completed: daily.completed + weekly.completed + monthly.completed,
    total: daily.total + weekly.total + monthly.total,
  };
  overall.completed = Math.min(overall.completed, overall.total);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    {
      label: "Daily",
      href: "/daily",
      icon: Sun,
      color: "var(--color-primary)",
      ...daily,
    },
    {
      label: "Weekly",
      href: "/weekly",
      icon: Calendar,
      color: "var(--color-accent)",
      ...weekly,
    },
    {
      label: "Monthly",
      href: "/monthly",
      icon: CalendarRange,
      color: "var(--color-warning)",
      ...monthly,
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-[rgb(var(--color-text-muted))] mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Overall stats */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-accent))] flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Overall Progress</h2>
            <p className="text-sm text-[rgb(var(--color-text-muted))]">
              {overall.completed} of {overall.total} missions completed today
            </p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-3xl font-extrabold bg-gradient-to-r from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-accent))] bg-clip-text text-transparent">
              {overall.total > 0
                ? Math.round((overall.completed / overall.total) * 100)
                : 0}
              %
            </span>
          </div>
        </div>
        <div className="progress-bar h-2">
          <div
            className="progress-bar-fill"
            style={{
              width: `${
                overall.total > 0
                  ? Math.round((overall.completed / overall.total) * 100)
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <div className="glass-card p-6 cursor-pointer group">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: `rgba(${card.color}, 0.15)`,
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: `rgb(${card.color})` }}
                    />
                  </div>
                  <h3 className="font-semibold">{card.label}</h3>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold">{card.completed}</span>
                    <span className="text-[rgb(var(--color-text-dim))] text-sm">
                      /{card.total}
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: `rgb(${card.color})` }}
                  >
                    {card.pct}%
                  </span>
                </div>
                <div className="progress-bar mt-3">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${card.pct}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Latest Report */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-[rgb(var(--color-primary-light))]" />
            <h3 className="font-semibold">Latest AI Report</h3>
          </div>
          {latestReport ? (
            <Link href={`/reports/${latestReport.id}`}>
              <div className="text-sm text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))] transition-colors">
                <p className="capitalize">{latestReport.report_type} Report</p>
                <p className="text-xs text-[rgb(var(--color-text-dim))] mt-1">
                  {latestReport.period_start} → {latestReport.period_end}
                </p>
                <span className="text-xs text-[rgb(var(--color-primary))] mt-2 inline-block">
                  View report →
                </span>
              </div>
            </Link>
          ) : (
            <p className="text-sm text-[rgb(var(--color-text-dim))]">
              No reports yet. Complete missions and reports will be generated
              automatically.
            </p>
          )}
        </div>

        {/* Streak / Motivational */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-[rgb(var(--color-accent))]" />
            <h3 className="font-semibold">Today&apos;s Focus</h3>
          </div>
          <div className="space-y-2">
            {dailyMissions
              .filter(
                (m) =>
                  !dailyLogs.find(
                    (l) => l.mission_id === m.id && l.is_completed
                  )
              )
              .slice(0, 3)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 text-sm text-[rgb(var(--color-text-muted))]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[rgb(var(--color-text-dim))]" />
                  {m.title}
                </div>
              ))}
            {dailyMissions.filter(
              (m) =>
                !dailyLogs.find(
                  (l) => l.mission_id === m.id && l.is_completed
                )
            ).length === 0 && (
              <p className="text-sm text-[rgb(var(--color-accent))]">
                🎉 All daily missions complete!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
