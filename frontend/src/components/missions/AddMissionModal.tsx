"use client";

import { useState } from "react";
import { X } from "lucide-react";
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
}

export default function AddMissionModal({
  isOpen,
  onClose,
  onSubmit,
  defaultFrequency = "daily",
}: AddMissionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency>(defaultFrequency);
  const [missionType, setMissionType] = useState<MissionType>("boolean");
  const [targetCount, setTargetCount] = useState(1);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      frequency,
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

        <h2 className="text-xl font-bold mb-6">Add New Mission</h2>

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

          {/* Frequency */}
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
              <input
                type="number"
                value={targetCount}
                onChange={(e) =>
                  setTargetCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="input-field w-32"
                min={1}
              />
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
