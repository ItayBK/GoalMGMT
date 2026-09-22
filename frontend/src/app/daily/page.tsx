"use client";

import MissionPage from "@/components/missions/MissionPage";

export default function DailyPage() {
  return (
    <MissionPage
      frequency="daily"
      title="Daily Missions"
      subtitle="Tasks to complete every day. Consistency is key."
    />
  );
}
