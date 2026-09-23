"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      await api.delete("/users/me");
      toast.success("Account deleted");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch {
      toast.error("Failed to delete account");
      setIsDeleting(false);
    }
  }

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
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 mb-6 border border-red-500/20 bg-red-500/5">
        <h2 className="text-lg font-bold text-red-500 mb-2">Danger Zone</h2>
        <p className="text-sm text-[rgb(var(--color-text-muted))] mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? "Deleting..." : "Delete Account"}
        </button>
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
