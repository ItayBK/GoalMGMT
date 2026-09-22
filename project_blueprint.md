# Project Blueprint: Task Management & Self-Improvement App

## Product Overview & Core User Flow
A web application designed to help users track and achieve their personal goals through daily, weekly, and monthly missions. The app acts as a strict accountability partner, offering progress tracking, calendar views, and deep AI-driven insights.

**Core User Flow:**
1. **Onboarding & Setup:** User registers/logs in and configures their initial missions (e.g., "Drink 2L water" - Daily, "Run 10km" - Weekly).
2. **Daily Usage:** User logs in daily, views their Dashboard, and checks off completed missions for the day/week/month.
3. **End of Period:** The background system automatically aggregates the completion data at the end of each period (midnight for daily, Sunday night for weekly, end of month for monthly).
4. **AI Analysis & Reporting:** The system sends the aggregated data to the Gemini API, generating a detailed performance report.
5. **Notification:** The user receives a motivational email via Resend with a summary of their report and a link to view the full details on the AI Reports page.

## Tech Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS.
* **Backend:** Python, FastAPI.
* **Database:** Supabase (Cloud-hosted PostgreSQL) connected via SQLModel (for seamless Pydantic/SQLAlchemy integration).
* **Background Jobs:** FastAPI BackgroundTasks (immediate) & APScheduler / External Cron (scheduled).
* **AI Integration:** Google Gemini API.
* **Email Provider:** Resend.
* **Authentication:** NextAuth / JWT.

## Database Schema (SQLModel)

### `User`
* `id`: UUID (Primary Key)
* `email`: String (Unique)
* `hashed_password`: String
* `created_at`: DateTime
* `timezone`: String (Default: UTC)

### `Mission`
* `id`: UUID (Primary Key)
* `user_id`: UUID (Foreign Key -> User.id)
* `title`: String
* `description`: String (Optional)
* `frequency`: Enum (`DAILY`, `WEEKLY`, `MONTHLY`)
* `mission_type`: Enum (`BOOLEAN`, `COUNTER`)
* `target_count`: Integer (Nullable, Default 1 - only relevant for COUNTER missions)
* `created_at`: DateTime
* `is_active`: Boolean (Default: True - allows soft deletion)

### `MissionLog`
* `id`: UUID (Primary Key)
* `mission_id`: UUID (Foreign Key -> Mission.id)
* `user_id`: UUID (Foreign Key -> User.id)
* `is_completed`: Boolean (Default: False)
* `current_count`: Integer (Default: 0)
* `completed_at`: DateTime (Nullable)
* `period_start`: Date (The start date of the period this log belongs to)
* `period_end`: Date (The end date of the period this log belongs to)

### `AIReport`
* `id`: UUID (Primary Key)
* `user_id`: UUID (Foreign Key -> User.id)
* `report_type`: Enum (`DAILY`, `WEEKLY`, `MONTHLY`)
* `period_start`: Date
* `period_end`: Date
* `content`: Text (Markdown formatted response from Gemini)
* `created_at`: DateTime

## API Routes (FastAPI)

### Authentication
* `POST /api/auth/register` - Create a new user.
* `POST /api/auth/login` - Authenticate and return JWT.

### Missions (CRUD)
* `GET /api/missions` - List all active missions (query params for frequency).
* `POST /api/missions` - Create a new mission.
* `PUT /api/missions/{id}` - Update a mission.
* `DELETE /api/missions/{id}` - Soft delete a mission.

### Mission Logging
* `GET /api/logs` - Get logs for a specific timeframe (used for Dashboard and Calendar).
* `POST /api/logs/{mission_id}` - Mark a mission as complete for the current period.
* `DELETE /api/logs/{log_id}` - Unmark a mission as complete.

### AI Reports
* `GET /api/reports` - Fetch a list of past reports.
* `GET /api/reports/{id}` - Fetch a specific report's full content.
* `POST /api/reports/trigger` - (Admin/Debug) Manually trigger report generation for a user.

### Scheduled Tasks (Cron Endpoints)
* `POST /api/cron/daily` - Trigger daily reports and emails (Secured via API Key).
* `POST /api/cron/weekly` - Trigger weekly reports and emails (Secured via API Key).
* `POST /api/cron/monthly` - Trigger monthly reports and emails (Secured via API Key).

### User Settings
* `GET /api/users/me` - Get current user profile and settings.
* `PUT /api/users/me` - Update profile (e.g., timezone).

## Background & Scheduled Tasks (FastAPI + APScheduler)

1. **Scheduled Triggers (`generate_daily_reports`, `generate_weekly_reports`, `generate_monthly_reports`)**
   * Executed via in-app APScheduler or triggered via secured REST endpoints (`/api/cron/*`) by an external Cron service.
   * Fetches active missions and their logs for the respective period.
   * Calls `process_ai_report` sequentially or via `asyncio.gather` for users.
2. **`process_ai_report(user_id, period_type, stats_data)`**
   * Calls Gemini API with the formatted data.
   * Saves the result to the `AIReport` table.
   * Enqueues `send_report_email` via FastAPI's `BackgroundTasks`.
3. **`send_report_email(user_id, report_id)` (FastAPI BackgroundTasks)**
   * Uses Resend to send a motivational email right after the AI report is saved.
   * Can also be used for immediate transactional emails without blocking the main request thread.

## AI Integration Flow (Gemini API)

1. **Data Aggregation:** The scheduled task gathers a user's data for the period.
   * Example: `Total Missions: 10, Completed: 7, Missed: 3 ("Drink Water", "Read 10 pages", "Workout")`.
2. **Prompt Construction:** The backend formats this into a strict prompt structure.
   * *System Prompt:* "You are a world-class life coach and productivity expert. Analyze the user's task completion data. Be encouraging but firm. Highlight strengths, identify bottlenecks, and give 2-3 actionable tips for the next period. Output in Markdown."
   * *User Prompt:* JSON payload of missions and completion status.
3. **API Call:** Send the prompt to the Gemini API (`gemini-1.5-pro` or appropriate model).
4. **Storage:** The raw markdown response is saved directly into the `content` field of the `AIReport` table.

## Frontend Architecture (Next.js App Router)

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx                 # Dashboard (Overview)
│   │   ├── daily/page.tsx           # Daily Missions
│   │   ├── weekly/page.tsx          # Weekly Missions
│   │   ├── monthly/page.tsx         # Monthly Missions
│   │   ├── calendar/page.tsx        # Calendar View
│   │   ├── reports/page.tsx         # AI Reports & History List
│   │   ├── reports/[id]/page.tsx    # Single AI Report View
│   │   └── settings/page.tsx        # User Settings
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                          # Reusable UI (Buttons, Cards, Modals)
│   ├── layout/                      # Sidebar, Navbar
│   ├── missions/                    # MissionCard, MissionList, AddMissionModal
│   └── reports/                     # ReportCard, MarkdownRenderer
├── lib/
│   ├── api.ts                       # Axios/Fetch wrappers for FastAPI endpoints
│   ├── auth.ts                      # NextAuth configuration
│   └── utils.ts                     # Helper functions (date formatting, etc.)
└── types/                           # TypeScript interfaces corresponding to SQLModel schemas
```