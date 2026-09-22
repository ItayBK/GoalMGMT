"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import type { AIReport } from "@/types";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<AIReport[]>("/reports?limit=50");
        setReports(res.data);
      } catch {
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    daily: "var(--color-primary)",
    weekly: "var(--color-accent)",
    monthly: "var(--color-warning)",
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-1">AI Reports</h1>
      <p className="text-[rgb(var(--color-text-muted))] mb-8">
        Your AI-generated performance analyses
      </p>

      {reports.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-[rgb(var(--color-text-dim))] mx-auto mb-4" />
          <p className="text-[rgb(var(--color-text-dim))] text-lg mb-2">
            No reports yet
          </p>
          <p className="text-sm text-[rgb(var(--color-text-dim))]">
            Reports are generated automatically at the end of each period.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report, i) => (
            <Link key={report.id} href={`/reports/${report.id}`}>
              <div
                className="glass-card p-5 flex items-center gap-4 group cursor-pointer"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `rgba(${typeColors[report.report_type]}, 0.15)`,
                  }}
                >
                  <BarChart3
                    className="w-5 h-5"
                    style={{
                      color: `rgb(${typeColors[report.report_type]})`,
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm capitalize">
                    {report.report_type} Report
                  </h3>
                  <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                    {report.period_start} → {report.period_end}
                  </p>
                </div>
                <div className="text-xs text-[rgb(var(--color-text-dim))]">
                  {new Date(report.created_at).toLocaleDateString()}
                </div>
                <ArrowRight className="w-4 h-4 text-[rgb(var(--color-text-dim))] group-hover:text-[rgb(var(--color-primary))] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
