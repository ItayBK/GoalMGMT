"use client";

import { useEffect, useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import type { Frequency, MissionType } from "@/types";

interface AddMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    frequency: Frequency;
    mission_type: MissionType;
    target_count: number;
  }) => void;
  defaultFrequency?: Frequency;
  lockFrequency?: boolean;
}

export default function AddMissionModal({
  isOpen,
  onClose,
  onSubmit,
  defaultFrequency = "daily",
  lockFrequency = false,
}: AddMissionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency>(defaultFrequency);
  const [missionType, setMissionType] = useState<MissionType>("boolean");
  const [targetCount, setTargetCount] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setFrequency(defaultFrequency);
      setTitle("");
      setDescription("");
      setMissionType("boolean");
      setTargetCount(1);
    }
  }, [isOpen, defaultFrequency]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      frequency: lockFrequency ? defaultFrequency : frequency,
      mission_type: missionType,
      target_count: missionType === "counter" ? targetCount : 1,
    });
    // Reset
    setTitle("");
    setDescription("");
    setMissionType("boolean");
    setTargetCount(1);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card p-8 w-full max-w-md animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[rgb(var(--color-text-dim))] hover:text-[rgb(var(--color-text))] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">
          {lockFrequency
            ? `Add ${defaultFrequency.charAt(0).toUpperCase() + defaultFrequency.slice(1)} Mission`
            : "Add New Mission"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--color-text-muted))] mb-1.5 uppercase tracking-wider">
              Mission Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g., Drink 2L of water"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--color-text-muted))] mb-1.5 uppercase tracking-wider">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="Add details or notes..."
            />
          </div>

          {/* Frequency - only shown when not locked (e.g. Dashboard) */}
          {!lockFrequency && (
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--color-text-muted))] mb-1.5 uppercase tracking-wider">
                Frequency
              </label>
              <div className="flex gap-2">
                {(["daily", "weekly", "monthly"] as Frequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      frequency === f
                        ? "bg-[rgba(var(--color-primary),0.2)] text-[rgb(var(--color-primary-light))] border border-[rgba(var(--color-primary),0.4)]"
                        : "bg-[rgba(var(--color-surface),0.6)] text-[rgb(var(--color-text-muted))] border border-[rgba(var(--color-border),0.3)] hover:border-[rgba(var(--color-border),0.6)]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mission Type */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--color-text-muted))] mb-1.5 uppercase tracking-wider">
              Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMissionType("boolean")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  missionType === "boolean"
                    ? "bg-[rgba(var(--color-primary),0.2)] text-[rgb(var(--color-primary-light))] border border-[rgba(var(--color-primary),0.4)]"
                    : "bg-[rgba(var(--color-surface),0.6)] text-[rgb(var(--color-text-muted))] border border-[rgba(var(--color-border),0.3)] hover:border-[rgba(var(--color-border),0.6)]"
                }`}
              >
                ✓ Yes/No
              </button>
              <button
                type="button"
                onClick={() => setMissionType("counter")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  missionType === "counter"
                    ? "bg-[rgba(var(--color-primary),0.2)] text-[rgb(var(--color-primary-light))] border border-[rgba(var(--color-primary),0.4)]"
                    : "bg-[rgba(var(--color-surface),0.6)] text-[rgb(var(--color-text-muted))] border border-[rgba(var(--color-border),0.3)] hover:border-[rgba(var(--color-border),0.6)]"
                }`}
              >
                # Counter
              </button>
            </div>
          </div>

          {/* Target Count (only for counter) */}
          {missionType === "counter" && (
            <div className="animate-slide-up">
              <label className="block text-xs font-medium text-[rgb(var(--color-text-muted))] mb-1.5 uppercase tracking-wider">
                Target Count
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTargetCount((prev) => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-xl border border-[rgba(var(--color-border),0.5)] flex items-center justify-center text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.1)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={targetCount <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-16 h-10 flex items-center justify-center bg-[rgba(var(--color-surface),0.6)] border border-[rgba(var(--color-border),0.3)] rounded-xl font-mono font-bold text-lg shadow-inner">
                  {targetCount}
                </div>
                <button
                  type="button"
                  onClick={() => setTargetCount((prev) => prev + 1)}
                  className="w-10 h-10 rounded-xl border border-[rgba(var(--color-border),0.5)] flex items-center justify-center text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.1)] transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="btn-primary w-full mt-2">
            Create Mission
          </button>
        </form>
      </div>
    </div>
  );
}
