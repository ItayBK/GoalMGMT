/* ============================================================
   GoalMGMT TypeScript Interfaces
   Maps 1:1 with the backend SQLModel schemas.
   ============================================================ */

export type Frequency = "daily" | "weekly" | "monthly";
export type MissionType = "boolean" | "counter";
export type ReportType = "daily" | "weekly" | "monthly";

export interface User {
  id: string;
  email: string;
  timezone: string;
  created_at: string;
}

export interface Mission {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  frequency: Frequency;
  mission_type: MissionType;
  target_count: number;
  is_active: boolean;
  created_at: string;
}

export interface MissionLog {
  id: string;
  mission_id: string;
  user_id: string;
  is_completed: boolean;
  current_count: number;
  completed_at: string | null;
  period_start: string;
  period_end: string;
}

export interface AIReport {
  id: string;
  user_id?: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  content?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
