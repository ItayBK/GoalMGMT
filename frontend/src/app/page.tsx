"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sun,
  Calendar,
  CalendarRange,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Target,
  Plus,
} from "lucide-react";
import api from "@/lib/api";
import { pageCache } from "@/lib/cache";
import AddMissionModal from "@/components/missions/AddMissionModal";
import type { Mission, MissionLog, AIReport, Frequency } from "@/types";
import toast from "react-hot-toast";

function getPeriodBounds(frequency: "daily" | "weekly" | "monthly") {
  const today = new Date();
  const yyyy = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  if (frequency === "daily") return { start: yyyy(today), end: yyyy(today) };
  if (frequency === "weekly") {
    const day = today.getDay();
    const diff = today.getDate() - day;
    const sunday = new Date(today);
    sunday.setDate(diff);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    return { start: yyyy(sunday), end: yyyy(saturday) };
  }
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: yyyy(start), end: yyyy(end) };
}

export default function DashboardPage() {
  const DASHBOARD_CACHE_KEY = "dashboard-page-data";
  const cached = pageCache.get<any>(DASHBOARD_CACHE_KEY);

  const [dailyMissions, setDailyMissions] = useState<Mission[]>(cached?.dm ?? []);
  const [dailyLogs, setDailyLogs] = useState<MissionLog[]>(cached?.dl ?? []);
  const [weeklyMissions, setWeeklyMissions] = useState<Mission[]>(cached?.wm ?? []);
  const [weeklyLogs, setWeeklyLogs] = useState<MissionLog[]>(cached?.wl ?? []);
  const [monthlyMissions, setMonthlyMissions] = useState<Mission[]>(cached?.mm ?? []);
  const [monthlyLogs, setMonthlyLogs] = useState<MissionLog[]>(cached?.ml ?? []);
  const [latestReport, setLatestReport] = useState<AIReport | null>(cached?.rep ?? null);
  const [loading, setLoading] = useState(!cached);
  const [showAddModal, setShowAddModal] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Guard against double-clicks
  const pendingIdsRef = useRef<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  function addPending(id: string) {
    pendingIdsRef.current.add(id);
    setPendingIds(new Set(pendingIdsRef.current));
  }

  function removePending(id: string) {
    pendingIdsRef.current.delete(id);
    setPendingIds(new Set(pendingIdsRef.current));
  }

  async function handleAddMission(data: {
    title: string;
    description: string;
    frequency: Frequency;
    mission_type: string;
    target_count: number;
  }) {
    try {
      const res = await api.post<Mission>("/missions/", data);
      const newMission = res.data;
      if (newMission.frequency === "daily") {
        setDailyMissions((prev) => [newMission, ...prev]);
      } else if (newMission.frequency === "weekly") {
        setWeeklyMissions((prev) => [newMission, ...prev]);
      } else if (newMission.frequency === "monthly") {
        setMonthlyMissions((prev) => [newMission, ...prev]);
      }

      // Sync cache for the section so navigating there is immediate
      const cacheKey = `missions-page-${newMission.frequency}`;
      const cached = pageCache.get<{ missions: Mission[]; logs: MissionLog[] }>(cacheKey);
      if (cached) {
        pageCache.set(cacheKey, {
          missions: [newMission, ...cached.missions],
          logs: cached.logs,
        });
      }

      toast.success("Mission created!");
    } catch {
      toast.error("Failed to create mission");
    }
  }

  async function handleToggleDaily(missionId: string) {
    if (pendingIdsRef.current.has(missionId)) return;
    addPending(missionId);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // --- Optimistic update ---
    const prevLogs = dailyLogs;
    const existingLog = dailyLogs.find((l) => l.mission_id === missionId);
    const nowOptimistic: MissionLog = existingLog
      ? { ...existingLog, is_completed: !existingLog.is_completed, completed_at: !existingLog.is_completed ? new Date().toISOString() : null }
      : {
          id: `optimistic-${missionId}`,
          mission_id: missionId,
          user_id: "",
          is_completed: true,
          current_count: 0,
          completed_at: new Date().toISOString(),
          period_start: todayStr,
          period_end: todayStr,
        };
    const optimisticLogs = [
      ...prevLogs.filter((l) => l.mission_id !== missionId),
      nowOptimistic,
    ];
    setDailyLogs(optimisticLogs);
    // --- End optimistic update ---

    try {
      const res = await api.post<MissionLog>(
        `/logs/${missionId}/toggle?target_date=${todayStr}`
      );
      setDailyLogs((prev) => {
        const next = [...prev.filter((l) => l.mission_id !== missionId), res.data];
        // Sync cache for /daily
        const cacheKey = `missions-page-daily-${todayStr}`;
        const cached = pageCache.get<{ missions: Mission[]; logs: MissionLog[] }>(cacheKey);
        if (cached) {
          pageCache.set(cacheKey, {
            missions: cached.missions,
            logs: next,
          });
        }
        return next;
      });
      toast.success(res.data.is_completed ? "Mission completed! 🎉" : "Marked incomplete");
    } catch {
      // Rollback
      setDailyLogs(prevLogs);
      toast.error("Failed to update mission");
    } finally {
      removePending(missionId);
    }
  }

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

        pageCache.set(DASHBOARD_CACHE_KEY, {
          dm: dm.data, dl: dl.data,
          wm: wm.data, wl: wl.data,
          mm: mm.data, ml: ml.data,
          rep: rep.data[0] || null
        });

        // Pre-seed the shared pageCache so /daily, /weekly, /monthly render
        // instantly without a spinner when the user navigates there.
        pageCache.set(`missions-page-daily-${db.start}`, { missions: dm.data, logs: dl.data });
        pageCache.set(`missions-page-weekly-${wb.start}`, { missions: wm.data, logs: wl.data });
        pageCache.set(`missions-page-monthly-${mb.start}`, { missions: mm.data, logs: ml.data });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-[rgb(var(--color-text-muted))] mt-1 h-6">
            {now ? now.toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            }) : ""}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Mission
        </button>
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-[rgb(var(--color-accent))]" />
              <h3 className="font-semibold">Today&apos;s Focus</h3>
            </div>
            <Link
              href="/daily"
              className="text-xs text-[rgb(var(--color-primary-light))] hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {dailyMissions.map((m) => {
              const isDone = dailyLogs.find(
                (l) => l.mission_id === m.id && l.is_completed
              );
              return (
                <div
                  key={m.id}
                  onClick={() => !pendingIdsRef.current.has(m.id) && handleToggleDaily(m.id)}
                  className={`flex items-center justify-between gap-3 text-sm p-2.5 rounded-xl transition-all ${
                    pendingIds.has(m.id) ? "opacity-70 cursor-wait" : "cursor-pointer"
                  } ${
                    isDone
                      ? "bg-[rgba(var(--color-accent),0.08)] border border-[rgba(var(--color-accent),0.2)] text-[rgb(var(--color-text-dim))]"
                      : "hover:bg-[rgba(var(--color-surface-hover),0.6)] border border-[rgba(var(--color-border),0.4)] text-[rgb(var(--color-text))]"
                  }`}
                  title={isDone ? "Click to uncheck" : "Click to mark done today"}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                        isDone
                          ? "bg-[rgb(var(--color-accent))] border-[rgb(var(--color-accent))]"
                          : "border-[rgba(var(--color-border),0.8)]"
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`truncate text-xs sm:text-sm ${isDone ? "line-through" : "font-medium"}`}>
                      {m.title}
                    </span>
                  </div>
                  {isDone && (
                    <span className="text-[10px] uppercase font-bold text-[rgb(var(--color-accent))] bg-[rgba(var(--color-accent),0.15)] px-2 py-0.5 rounded-full flex-shrink-0">
                      Done
                    </span>
                  )}
                </div>
              );
            })}
            {dailyMissions.length === 0 && (
              <p className="text-sm text-[rgb(var(--color-text-dim))]">
                No daily missions yet. Click &quot;Add Mission&quot; above to create one!
              </p>
            )}
          </div>
        </div>
      </div>

      <AddMissionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMission}
        defaultFrequency="daily"
        lockFrequency={false}
      />
    </div>
  );
}
