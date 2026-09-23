"use client";

import { Check, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import type { Mission, MissionLog } from "@/types";

interface MissionCardProps {
  mission: Mission;
  log?: MissionLog;
  onToggle: (missionId: string) => void;
  onIncrement: (missionId: string, increment: number) => void;
  onDelete?: (missionId: string) => void;
  /** True while an API call for this card is in-flight. Disables interactions. */
  isPending?: boolean;
}

export default function MissionCard({
  mission,
  log,
  onToggle,
  onIncrement,
  onDelete,
  isPending = false,
}: MissionCardProps) {
  const isCompleted = log?.is_completed ?? false;
  const currentCount = log?.current_count ?? 0;

  return (
    <div
      className={`glass-card border p-5 animate-slide-up transition-all ${
        isPending ? "opacity-75" : ""
      } ${
        isCompleted
          ? "border-[rgba(var(--color-accent),0.5)] bg-[rgba(var(--color-accent),0.04)]"
          : "border-[rgba(var(--color-border),0.8)] hover:border-[rgba(var(--color-primary),0.5)]"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox / Counter control */}
        {mission.mission_type === "boolean" ? (
          <button
            type="button"
            onClick={() => !isPending && onToggle(mission.id)}
            disabled={isPending}
            className={`mission-checkbox ${isCompleted ? "checked" : ""} ${isPending ? "cursor-wait" : ""}`}
            title={isCompleted ? "Click to mark as incomplete" : "Click to mark as completed"}
            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              isCompleted && <Check className="w-4 h-4 text-white stroke-[3]" />
            )}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => !isPending && onIncrement(mission.id, -1)}
              className="w-8 h-8 rounded-lg border border-[rgba(var(--color-border),0.5)] flex items-center justify-center text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentCount <= 0 || isPending}
              title="Decrease count"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-semibold min-w-[44px] text-center px-1">
              <span
                className={
                  isCompleted
                    ? "text-[rgb(var(--color-accent))] font-bold"
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
              type="button"
              onClick={() => !isPending && onIncrement(mission.id, 1)}
              className="w-8 h-8 rounded-lg border border-[rgba(var(--color-border),0.5)] flex items-center justify-center text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent))] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={isPending}
              title="Increase count"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className={`flex-1 min-w-0 ${
            mission.mission_type === "boolean" && !isPending ? "cursor-pointer" : ""
          }`}
          onClick={() => {
            if (mission.mission_type === "boolean" && !isPending) {
              onToggle(mission.id);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <h3
              className={`font-semibold text-sm transition-all ${
                isCompleted
                  ? "line-through text-[rgb(var(--color-text-dim))]"
                  : "text-[rgb(var(--color-text))]"
              }`}
            >
              {mission.title}
            </h3>
            {isCompleted && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[rgba(var(--color-accent),0.15)] text-[rgb(var(--color-accent))] border border-[rgba(var(--color-accent),0.3)]">
                Done
              </span>
            )}
          </div>
          {mission.description && (
            <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">
              {mission.description}
            </p>
          )}
        </div>

        {/* Delete action */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(mission.id);
            }}
            disabled={isPending}
            className="p-2 rounded-lg text-[rgb(var(--color-text-dim))] hover:text-[rgb(var(--color-danger))] hover:bg-[rgba(var(--color-danger),0.1)] transition-colors opacity-60 hover:opacity-100 flex-shrink-0 disabled:cursor-wait"
            title="Delete mission permanently"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
