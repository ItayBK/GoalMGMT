"use client";

import MissionPage from "@/components/missions/MissionPage";

export default function WeeklyPage() {
  return (
    <MissionPage
      frequency="weekly"
      title="Weekly Missions"
      subtitle="Goals to achieve each week. Think bigger."
    />
  );
}
