"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Calendar, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { pageCache } from "@/lib/cache";
import type { Frequency, Mission, MissionLog } from "@/types";
import MissionCard from "@/components/missions/MissionCard";
import AddMissionModal from "@/components/missions/AddMissionModal";

interface MissionPageProps {
  frequency: Frequency;
  title: string;
  subtitle: string;
}

interface PageData {
  missions: Mission[];
  logs: MissionLog[];
}

function yyyy(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getPeriodBounds(frequency: Frequency, ref: Date): {
  start: string;
  end: string;
} {
  if (frequency === "daily") {
    const s = yyyy(ref);
    return { start: s, end: s };
  }

  if (frequency === "weekly") {
    const day = ref.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const diff = ref.getDate() - day; // Shift to Sunday
    const sunday = new Date(ref);
    sunday.setDate(diff);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    return { start: yyyy(sunday), end: yyyy(saturday) };
  }

  // monthly
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { start: yyyy(start), end: yyyy(end) };
}

function formatPeriodLabel(frequency: Frequency, ref: Date): string {
  const todayStr = yyyy(new Date());
  const refStr = yyyy(ref);

  if (frequency === "daily") {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatted = ref.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    if (refStr === todayStr) return `Today — ${formatted}`;
    if (refStr === yyyy(yesterday)) return `Yesterday — ${formatted}`;
    if (refStr === yyyy(tomorrow)) return `Tomorrow — ${formatted}`;
    return ref.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (frequency === "weekly") {
    const bounds = getPeriodBounds("weekly", ref);
    const mon = new Date(bounds.start + "T12:00:00");
    const sun = new Date(bounds.end + "T12:00:00");
    const todayBounds = getPeriodBounds("weekly", new Date());
    const isCurrentWeek = bounds.start === todayBounds.start;

    const prefix = isCurrentWeek ? "This Week (" : "Week of ";
    const suffix = isCurrentWeek ? ")" : "";
    return `${prefix}${mon.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${sun.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${suffix}`;
  }

  // Monthly
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const isCurrentMonth =
    ref.getMonth() === currentMonth && ref.getFullYear() === currentYear;
  const monthName = ref.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  return isCurrentMonth ? `This Month — ${monthName}` : monthName;
}

export default function MissionPage({
  frequency,
  title,
  subtitle,
}: MissionPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const { start, end } = getPeriodBounds(frequency, currentDate);
  const cacheKey = `missions-page-${frequency}-${start}`;

  // Seed state from cache
  const cached = pageCache.get<PageData>(cacheKey);
  const [missions, setMissions] = useState<Mission[]>(cached?.missions ?? []);
  const [logs, setLogs] = useState<MissionLog[]>(cached?.logs ?? []);
  const [loading, setLoading] = useState(!cached);

  const [prevCacheKey, setPrevCacheKey] = useState(cacheKey);
  if (cacheKey !== prevCacheKey) {
    setPrevCacheKey(cacheKey);
    setMissions(cached?.missions ?? []);
    setLogs(cached?.logs ?? []);
    setLoading(!cached);
  }

  // Track in-flight mission IDs to prevent double-clicks.
  // pendingIdsRef is checked SYNCHRONOUSLY (avoids stale-closure race on rapid clicks).
  // pendingIds state is only used to re-render MissionCard with isPending.
  const pendingIdsRef = useRef<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  // Ref counter for how many mutations are currently in-flight.
  // The background revalidation (fetchData) skips setLogs while this is > 0
  // to avoid stomping optimistic state.
  const pendingMutations = useRef(0);

  /** Add a mission to the pending set (both ref and state). */
  function addPending(id: string) {
    pendingIdsRef.current.add(id);
    setPendingIds(new Set(pendingIdsRef.current));
  }

  /** Remove a mission from the pending set (both ref and state). */
  function removePending(id: string) {
    pendingIdsRef.current.delete(id);
    setPendingIds(new Set(pendingIdsRef.current));
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [missionsRes, logsRes] = await Promise.all([
          api.get<Mission[]>(`/missions/?frequency=${frequency}`),
          api.get<MissionLog[]>(`/logs/?start=${start}&end=${end}`),
        ]);
        if (ignore) return;
        const fresh: PageData = {
          missions: missionsRes.data,
          logs: logsRes.data,
        };
        pageCache.set(cacheKey, fresh);
        setMissions(fresh.missions);
        // Only overwrite logs if no mutation is currently in-flight.
        // If a toggle/increment is pending, its optimistic state is more
        // accurate than the stale server snapshot we just received.
        if (pendingMutations.current === 0) {
          setLogs(fresh.logs);
        }
      } catch {
        if (!ignore) toast.error("Failed to load missions");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();

    return () => {
      ignore = true;
    };
  }, [frequency, start, end, cacheKey]);

  function shiftPeriod(delta: number) {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (frequency === "daily") {
        next.setDate(next.getDate() + delta);
      } else if (frequency === "weekly") {
        next.setDate(next.getDate() + delta * 7);
      } else if (frequency === "monthly") {
        next.setMonth(next.getMonth() + delta);
      }
      return next;
    });
  }

  async function prefetchPeriod(delta: number) {
    const next = new Date(currentDate);
    if (frequency === "daily") {
      next.setDate(next.getDate() + delta);
    } else if (frequency === "weekly") {
      next.setDate(next.getDate() + delta * 7);
    } else if (frequency === "monthly") {
      next.setMonth(next.getMonth() + delta);
    }
    const bounds = getPeriodBounds(frequency, next);
    const k = `missions-page-${frequency}-${bounds.start}`;
    if (pageCache.get(k)) return;
    try {
      const [missionsRes, logsRes] = await Promise.all([
        api.get<Mission[]>(`/missions/?frequency=${frequency}`),
        api.get<MissionLog[]>(`/logs/?start=${bounds.start}&end=${bounds.end}`),
      ]);
      pageCache.set(k, {
        missions: missionsRes.data,
        logs: logsRes.data,
      });
    } catch {}
  }

  function jumpToCurrent() {
    setCurrentDate(new Date());
  }

  const isCurrentPeriod = (() => {
    const now = new Date();
    const currentBounds = getPeriodBounds(frequency, now);
    return start === currentBounds.start;
  })();

  const logsByMission = Object.fromEntries(
    logs.map((l) => [l.mission_id, l])
  );

  const completedCount = missions.filter(
    (m) => logsByMission[m.id]?.is_completed
  ).length;
  const totalCount = missions.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  async function handleToggle(missionId: string) {
    // Use the ref (not state) for the guard — state reads are stale on rapid clicks
    if (pendingIdsRef.current.has(missionId)) return;
    addPending(missionId);
    pendingMutations.current++;

    // --- Optimistic update ---
    const prevLogs = logs;
    const existingLog = logs.find((l) => l.mission_id === missionId);
    const optimisticLog: MissionLog = existingLog
      ? { ...existingLog, is_completed: !existingLog.is_completed, completed_at: !existingLog.is_completed ? new Date().toISOString() : null }
      : {
          id: `optimistic-${missionId}`,
          mission_id: missionId,
          user_id: "",
          is_completed: true,
          current_count: 0,
          completed_at: new Date().toISOString(),
          period_start: start,
          period_end: end,
        };
    const optimisticLogs = [
      ...prevLogs.filter((l) => l.mission_id !== missionId),
      optimisticLog,
    ];
    setLogs(optimisticLogs);
    pageCache.set(cacheKey, { missions, logs: optimisticLogs });
    // --- End optimistic update ---

    try {
      const res = await api.post<MissionLog>(
        `/logs/${missionId}/toggle?target_date=${start}`
      );
      // Reconcile with server truth
      setLogs((prev) => {
        const next = [...prev.filter((l) => l.mission_id !== missionId), res.data];
        pageCache.set(cacheKey, { missions, logs: next });
        return next;
      });
    } catch {
      // Rollback
      setLogs(prevLogs);
      pageCache.set(cacheKey, { missions, logs: prevLogs });
      toast.error("Failed to update");
    } finally {
      pendingMutations.current--;
      removePending(missionId);
    }
  }

  async function handleIncrement(missionId: string, increment: number) {
    // Use the ref (not state) for the guard — state reads are stale on rapid clicks
    if (pendingIdsRef.current.has(missionId)) return;
    addPending(missionId);
    pendingMutations.current++;

    // --- Optimistic update ---
    const prevLogs = logs;
    const mission = missions.find((m) => m.id === missionId);
    const existingLog = logs.find((l) => l.mission_id === missionId);
    const newCount = Math.max(0, (existingLog?.current_count ?? 0) + increment);
    const isCompleted = mission ? newCount >= mission.target_count : false;
    const optimisticLog: MissionLog = existingLog
      ? { ...existingLog, current_count: newCount, is_completed: isCompleted }
      : {
          id: `optimistic-${missionId}`,
          mission_id: missionId,
          user_id: "",
          is_completed: isCompleted,
          current_count: newCount,
          completed_at: isCompleted ? new Date().toISOString() : null,
          period_start: start,
          period_end: end,
        };
    const optimisticLogs = [
      ...prevLogs.filter((l) => l.mission_id !== missionId),
      optimisticLog,
    ];
    setLogs(optimisticLogs);
    pageCache.set(cacheKey, { missions, logs: optimisticLogs });
    // --- End optimistic update ---

    try {
      const res = await api.post<MissionLog>(
        `/logs/${missionId}/increment?target_date=${start}`,
        { increment }
      );
      // Reconcile with server truth
      setLogs((prev) => {
        const next = [...prev.filter((l) => l.mission_id !== missionId), res.data];
        pageCache.set(cacheKey, { missions, logs: next });
        return next;
      });
    } catch {
      // Rollback
      setLogs(prevLogs);
      pageCache.set(cacheKey, { missions, logs: prevLogs });
      toast.error("Failed to update");
    } finally {
      pendingMutations.current--;
      removePending(missionId);
    }
  }

  async function handleAddMission(data: {
    title: string;
    description: string;
    frequency: Frequency;
    mission_type: string;
    target_count: number;
  }) {
    try {
      const res = await api.post<Mission>("/missions/", {
        ...data,
        frequency,
      });
      setMissions((prev) => {
        const next = [res.data, ...prev];
        pageCache.set(cacheKey, { missions: next, logs });
        return next;
      });
      toast.success("Mission created!");
    } catch {
      toast.error("Failed to create mission");
    }
  }

  async function handleDeleteMission(missionId: string) {
    try {
      await api.delete(`/missions/${missionId}`);
      setMissions((prev) => {
        const next = prev.filter((m) => m.id !== missionId);
        pageCache.set(cacheKey, { missions: next, logs });
        return next;
      });
      toast.success("Mission deleted");
    } catch {
      toast.error("Failed to delete mission");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-[rgb(var(--color-text-muted))] mt-1">{subtitle}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Mission
        </button>
      </div>

      {/* Date Navigation Bar */}
      <div className="glass-card p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftPeriod(-1)}
          onMouseEnter={() => prefetchPeriod(-1)}
          className="btn-ghost p-2 flex items-center gap-1 text-xs"
          title="Previous period"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-[rgb(var(--color-primary-light))]" />
          <span className="font-semibold text-sm sm:text-base text-[rgb(var(--color-text))]">
            {formatPeriodLabel(frequency, currentDate)}
          </span>
          {!isCurrentPeriod && (
            <button
              type="button"
              onClick={jumpToCurrent}
              className="text-xs font-medium text-[rgb(var(--color-primary-light))] hover:underline flex items-center gap-1 ml-2 bg-[rgba(var(--color-primary),0.1)] px-2.5 py-1 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Today</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => shiftPeriod(1)}
          onMouseEnter={() => prefetchPeriod(1)}
          className="btn-ghost p-2 flex items-center gap-1 text-xs"
          title="Next period"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Progress summary */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[rgb(var(--color-text-muted))]">
            Progress for this period
          </span>
          <span className="text-sm font-bold">
            <span className="text-[rgb(var(--color-accent))]">{completedCount}</span>
            <span className="text-[rgb(var(--color-text-dim))]"> / {totalCount}</span>
            <span className="text-[rgb(var(--color-text-muted))] ml-2">{pct}%</span>
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Mission list */}
      {missions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-[rgb(var(--color-text-dim))] text-lg mb-4">
            No missions yet
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Create your first mission
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((mission, i) => (
            <div key={mission.id} style={{ animationDelay: `${i * 50}ms` }}>
              <MissionCard
                mission={mission}
                log={logsByMission[mission.id]}
                onToggle={handleToggle}
                onIncrement={handleIncrement}
                onDelete={handleDeleteMission}
                isPending={pendingIds.has(mission.id)}
              />
            </div>
          ))}
        </div>
      )}

      <AddMissionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddMission}
        defaultFrequency={frequency}
        lockFrequency={true}
      />
    </div>
  );
}
