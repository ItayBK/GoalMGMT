"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import api from "@/lib/api";
import type { AIReport } from "@/types";
import toast from "react-hot-toast";

// Simple markdown to HTML converter (handles common markdown patterns)
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[rgb(var(--color-text))]">$1</strong>')
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /^- (.*$)/gim,
      '<li class="ml-4 list-disc text-[rgb(var(--color-text-muted))]">$1</li>'
    )
    .replace(
      /^(\d+)\. (.*$)/gim,
      '<li class="ml-4 list-decimal text-[rgb(var(--color-text-muted))]">$2</li>'
    )
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<AIReport>(`/reports/${params.id}`);
        setReport(res.data);
      } catch {
        toast.error("Report not found");
        router.push("/reports");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) load();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => router.push("/reports")}
        className="flex items-center gap-2 text-sm text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Reports
      </button>

      {/* Report header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-accent))] flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold capitalize">
              {report.report_type} Report
            </h1>
            <p className="text-sm text-[rgb(var(--color-text-muted))]">
              {report.period_start} → {report.period_end} • Generated{" "}
              {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Report content */}
      <div className="glass-card p-8">
        <div
          className="text-[rgb(var(--color-text-muted))] leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(report.content || "No content available."),
          }}
        />
      </div>
    </div>
  );
}
