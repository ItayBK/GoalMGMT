"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import api from "@/lib/api";
import type { Mission, MissionLog } from "@/types";
import toast from "react-hot-toast";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [missions, setMissions] = useState<Mission[]>([]);
  const [logs, setLogs] = useState<MissionLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const yyyy = (d: Date) => d.toISOString().split("T")[0];
  const startOfMonth = yyyy(new Date(year, month, 1));
  const endOfMonth = yyyy(new Date(year, month + 1, 0));

  const fetchData = useCallback(async () => {
    try {
      const [m, l] = await Promise.all([
        api.get<Mission[]>("/missions"),
        api.get<MissionLog[]>(
          `/logs?start=${startOfMonth}&end=${endOfMonth}`
        ),
      ]);
      setMissions(m.data);
      setLogs(l.data);
    } catch {
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, [startOfMonth, endOfMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
    setLoading(true);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
    setLoading(true);
  }

  // Build day grid
  const days: (number | null)[] = [];
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-start
  for (let i = 0; i < offset; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  // Logs for a specific date
  function logsForDate(dateStr: string) {
    return logs.filter((l) => l.period_start <= dateStr && l.period_end >= dateStr);
  }

  function completionForDate(dateStr: string) {
    const dayLogs = logsForDate(dateStr);
    const completed = dayLogs.filter((l) => l.is_completed).length;
    const dailyMissions = missions.filter((m) => m.frequency === "daily");
    const total = dailyMissions.length;
    if (total === 0) return null;
    return { completed, total, pct: Math.round((completed / total) * 100) };
  }

  const today = yyyy(new Date());

  // Missions for selected date
  const selectedDateLogs = selectedDate ? logsForDate(selectedDate) : [];
  const logMap = Object.fromEntries(
    selectedDateLogs.map((l) => [l.mission_id, l])
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-1">Calendar</h1>
      <p className="text-[rgb(var(--color-text-muted))] mb-8">
        Track your progress over time
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 glass-card p-6">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="btn-ghost p-2">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold">{monthName}</h2>
            <button onClick={nextMonth} className="btn-ghost p-2">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-[rgb(var(--color-text-dim))] py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null)
                return <div key={`empty-${i}`} className="aspect-square" />;

              const dateStr = yyyy(new Date(year, month, day));
              const stats = completionForDate(dateStr);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all relative ${
                    isSelected
                      ? "bg-[rgba(var(--color-primary),0.2)] border border-[rgba(var(--color-primary),0.5)]"
                      : isToday
                      ? "bg-[rgba(var(--color-surface-hover),0.6)] border border-[rgba(var(--color-border),0.5)]"
                      : "hover:bg-[rgba(var(--color-surface-hover),0.4)]"
                  }`}
                >
                  <span
                    className={`font-medium ${
                      isToday
                        ? "text-[rgb(var(--color-primary-light))]"
                        : "text-[rgb(var(--color-text))]"
                    }`}
                  >
                    {day}
                  </span>
                  {stats && (
                    <div className="flex gap-0.5 mt-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          stats.pct === 100
                            ? "bg-[rgb(var(--color-accent))]"
                            : stats.pct > 0
                            ? "bg-[rgb(var(--color-warning))]"
                            : "bg-[rgb(var(--color-text-dim))]"
                        }`}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="glass-card p-6">
          {selectedDate ? (
            <>
              <h3 className="font-bold mb-4">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </h3>
              <div className="space-y-3">
                {missions
                  .filter((m) => m.frequency === "daily")
                  .map((m) => {
                    const log = logMap[m.id];
                    const completed = log?.is_completed ?? false;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        {completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[rgb(var(--color-accent))] flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-[rgb(var(--color-text-dim))] flex-shrink-0" />
                        )}
                        <span
                          className={
                            completed
                              ? "line-through text-[rgb(var(--color-text-dim))]"
                              : "text-[rgb(var(--color-text))]"
                          }
                        >
                          {m.title}
                        </span>
                      </div>
                    );
                  })}
                {missions.filter((m) => m.frequency === "daily").length ===
                  0 && (
                  <p className="text-sm text-[rgb(var(--color-text-dim))]">
                    No daily missions
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-[rgb(var(--color-text-dim))] text-sm">
              Click a date to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
