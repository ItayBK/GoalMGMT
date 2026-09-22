"use client";

import { useAuth } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "react-hot-toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.replace("/login");
    }
  }, [loading, user, isAuthPage, router]);

  // Auth pages — no sidebar
  if (isAuthPage) {
    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgb(var(--color-surface))",
              color: "rgb(var(--color-text))",
              border: "1px solid rgba(var(--color-border), 0.5)",
              borderRadius: "12px",
            },
          }}
        />
        {children}
      </>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Authenticated layout
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgb(var(--color-surface))",
            color: "rgb(var(--color-text))",
            border: "1px solid rgba(var(--color-border), 0.5)",
            borderRadius: "12px",
          },
        }}
      />
      <Sidebar />
      <main className="ml-64 min-h-screen p-8 relative z-10">
        <div className="gradient-orb gradient-orb-1" />
        <div className="gradient-orb gradient-orb-2" />
        <div className="relative z-10 max-w-6xl mx-auto">{children}</div>
      </main>
    </>
  );
}
