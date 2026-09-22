"use client";

import { Check, Minus, Plus } from "lucide-react";
import type { Mission, MissionLog } from "@/types";

interface MissionCardProps {
  mission: Mission;
  log?: MissionLog;
  onToggle: (missionId: string) => void;
  onIncrement: (missionId: string, increment: number) => void;
}

export default function MissionCard({
  mission,
  log,
  onToggle,
  onIncrement,
}: MissionCardProps) {
  const isCompleted = log?.is_completed ?? false;
  const currentCount = log?.current_count ?? 0;

  return (
    <div
      className={`glass-card p-5 animate-slide-up ${
        isCompleted ? "border-[rgba(var(--color-accent),0.3)]" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox / Counter control */}
        {mission.mission_type === "boolean" ? (
          <button
            onClick={() => onToggle(mission.id)}
            className={`mission-checkbox ${isCompleted ? "checked" : ""}`}
            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            {isCompleted && <Check className="w-3.5 h-3.5 text-white" />}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onIncrement(mission.id, -1)}
              className="w-7 h-7 rounded-lg border border-[rgba(var(--color-border),0.5)] flex items-center justify-center text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] transition-all"
              disabled={currentCount <= 0}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-semibold min-w-[40px] text-center">
              <span
                className={
                  isCompleted
                    ? "text-[rgb(var(--color-accent))]"
                    : "text-[rgb(var(--color-text))]"
                }
              >
                {currentCount}
              </span>
              <span className="text-[rgb(var(--color-text-dim))]">
                /{mission.target_count}
              </span>
            </span>
            <button
              onClick={() => onIncrement(mission.id, 1)}
              className="w-7 h-7 rounded-lg border border-[rgba(var(--color-border),0.5)] flex items-center justify-center text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent))] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold text-sm transition-all ${
              isCompleted
                ? "line-through text-[rgb(var(--color-text-dim))]"
                : "text-[rgb(var(--color-text))]"
            }`}
          >
            {mission.title}
          </h3>
          {mission.description && (
            <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">
              {mission.description}
            </p>
          )}
        </div>

        {/* Status badge */}
        {isCompleted && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[rgba(var(--color-accent),0.15)] text-[rgb(var(--color-accent))]">
            Done
          </span>
        )}
      </div>

      {/* Counter progress bar */}
      {mission.mission_type === "counter" && (
        <div className="mt-3 progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${Math.min(
                100,
                (currentCount / mission.target_count) * 100
              )}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
