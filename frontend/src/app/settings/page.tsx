"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Settings, Save } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/users/me", { timezone });
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Kolkata",
    "Asia/Jerusalem",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-1">Settings</h1>
      <p className="text-[rgb(var(--color-text-muted))] mb-8">
        Manage your account preferences
      </p>

      {/* Profile section */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))] flex items-center justify-center text-xl font-bold text-white uppercase">
            {user?.email?.charAt(0) || "?"}
          </div>
          <div>
            <h2 className="text-lg font-bold">Profile</h2>
            <p className="text-sm text-[rgb(var(--color-text-muted))]">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="space-y-5 max-w-md">
          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--color-text-muted))] mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="input-field opacity-60 cursor-not-allowed"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--color-text-muted))] mb-1.5 uppercase tracking-wider">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="input-field appearance-none cursor-pointer"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz} className="bg-[rgb(var(--color-surface))]">
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
            disabled={saving}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-3">
          <Settings className="w-5 h-5 text-[rgb(var(--color-text-dim))]" />
          <h3 className="font-semibold text-sm">About GoalMGMT</h3>
        </div>
        <p className="text-sm text-[rgb(var(--color-text-muted))]">
          Version 0.1.0 — AI-powered task management and self-improvement.
          Track your daily, weekly, and monthly missions and get intelligent
          progress reports powered by Google Gemini.
        </p>
      </div>
    </div>
  );
}
