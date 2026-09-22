"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { Frequency, Mission, MissionLog } from "@/types";
import MissionCard from "@/components/missions/MissionCard";
import AddMissionModal from "@/components/missions/AddMissionModal";

interface MissionPageProps {
  frequency: Frequency;
  title: string;
  subtitle: string;
}

function getPeriodBounds(frequency: Frequency): {
  start: string;
  end: string;
} {
  const today = new Date();
  const yyyy = (d: Date) => d.toISOString().split("T")[0];

  if (frequency === "daily") {
    const s = yyyy(today);
    return { start: s, end: s };
  }

  if (frequency === "weekly") {
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: yyyy(monday), end: yyyy(sunday) };
  }

  // monthly
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: yyyy(start), end: yyyy(end) };
}

export default function MissionPage({
  frequency,
  title,
  subtitle,
}: MissionPageProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [logs, setLogs] = useState<MissionLog[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { start, end } = getPeriodBounds(frequency);
      const [missionsRes, logsRes] = await Promise.all([
        api.get<Mission[]>(`/missions/?frequency=${frequency}`),
        api.get<MissionLog[]>(`/logs/?start=${start}&end=${end}`),
      ]);
      setMissions(missionsRes.data);
      setLogs(logsRes.data);
    } catch {
      toast.error("Failed to load missions");
    } finally {
      setLoading(false);
    }
  }, [frequency]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const logsByMission = Object.fromEntries(
    logs.map((l) => [l.mission_id, l])
  );

  const completedCount = missions.filter(
    (m) => logsByMission[m.id]?.is_completed
  ).length;
  const totalCount = missions.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  async function handleToggle(missionId: string) {
    try {
      const res = await api.post<MissionLog>(`/logs/${missionId}/toggle`);
      setLogs((prev) => {
        const filtered = prev.filter((l) => l.mission_id !== missionId);
        return [...filtered, res.data];
      });
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleIncrement(missionId: string, increment: number) {
    try {
      const res = await api.post<MissionLog>(`/logs/${missionId}/increment`, {
        increment,
      });
      setLogs((prev) => {
        const filtered = prev.filter((l) => l.mission_id !== missionId);
        return [...filtered, res.data];
      });
    } catch {
      toast.error("Failed to update");
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
      const res = await api.post<Mission>("/missions/", data);
      setMissions((prev) => [res.data, ...prev]);
      toast.success("Mission created!");
    } catch {
      toast.error("Failed to create mission");
    }
  }

  async function handleDeleteMission(missionId: string) {
    try {
      await api.delete(`/missions/${missionId}`);
      setMissions((prev) => prev.filter((m) => m.id !== missionId));
      toast.success("Mission removed");
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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-[rgb(var(--color-text-muted))] mt-1">{subtitle}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Mission
        </button>
      </div>

      {/* Progress summary */}
      <div className="glass-card p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[rgb(var(--color-text-muted))]">
            Progress
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
              <div className="group relative">
                <MissionCard
                  mission={mission}
                  log={logsByMission[mission.id]}
                  onToggle={handleToggle}
                  onIncrement={handleIncrement}
                />
                <button
                  onClick={() => handleDeleteMission(mission.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-[rgb(var(--color-text-dim))] hover:text-[rgb(var(--color-danger))] transition-all text-xs"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddMissionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddMission}
        defaultFrequency={frequency}
      />
    </div>
  );
}
