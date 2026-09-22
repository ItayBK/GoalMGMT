"use client";

import MissionPage from "@/components/missions/MissionPage";

export default function MonthlyPage() {
  return (
    <MissionPage
      frequency="monthly"
      title="Monthly Missions"
      subtitle="Big-picture goals for the month ahead."
    />
  );
}
