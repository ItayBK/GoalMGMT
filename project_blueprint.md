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
│   ├── api.ts                       # Axios wrapper for FastAPI endpoints
│   ├── auth.tsx                     # Auth provider with sessionStorage caching
│   ├── cache.ts                    # In-memory client-side cache for instant route navigation
│   └── utils.ts                     # Helper functions
└── types/                           # TypeScript interfaces corresponding to SQLModel schemas
```

---

## Recent Implementation & Performance Updates

### 1. Database & Infrastructure Optimization
* **Region Migration**: Transferred Supabase PostgreSQL instance from Mumbai (`ap-south-1`) to Frankfurt (`eu-central-1`), reducing baseline round-trip network latency from **~260–300ms** to **~110–140ms**.
* **Supabase PgBouncer Configuration**: Configured asyncpg engine with `NullPool`, `statement_cache_size: 0`, and dynamic `prepared_statement_name_func` using UUIDs. This prevents `DuplicatePreparedStatementError` when routing transactions through Supabase's transaction pooler (port 6543).
* **Removed Redundant Round-Trips**: Eliminated unnecessary `await session.refresh()` calls in mutation endpoints (`missions.py`, `logs.py`), since IDs and timestamps are generated in Python before insertion.

### 2. Frontend Performance & Instant Navigation
* **Self-Hosted Font Optimization**: Replaced render-blocking external Google Fonts `<link>` tag with Next.js built-in `next/font/google` (`Inter`), eliminating external stylesheet round-trips.
* **Session Restoration Caching**: Seeded user state from `sessionStorage` in `AuthProvider` so client route transitions render immediately without displaying a full-page auth loading spinner.
* **Stale-While-Revalidate In-Memory Cache**: Built a lightweight module-level cache (`frontend/src/lib/cache.ts`) that persists across client-side route transitions. Page revisits load instantly from cache while revalidating in the background.

### 3. Scope-Locked Mission Creation
* **Section-Locked Modals**: In `/daily`, `/weekly`, and `/monthly`, the Frequency selector is hidden, the modal title dynamically reads *"Add Daily/Weekly/Monthly Mission"*, and `frequency` is strictly locked to that section.
* **Dashboard Global Modal**: Added an **"Add Mission"** button directly to the Dashboard header (`/`), which provides the full frequency selector (`Daily`, `Weekly`, `Monthly`).
* **Client-Side Enforcement**: API payload in `MissionPage` explicitly sets the section's frequency to prevent accidental cross-period submissions.

### 4. Recurring Mission Lifecycle & Date History Navigation
* **Clear Action Separation**: Redesigned `MissionCard` to separate completion from deletion:
  - **Mark Done**: Prominent checkmark toggle. Toggling marks the mission completed for that period, turns the card emerald green, and displays a *"Done"* badge.
  - **Delete Mission**: Distinct trash icon (`<Trash2 />`) with tooltip *"Delete mission permanently"* replacing the ambiguous "Remove" link.
* **Period Date Navigation**: Added `< Prev` / `Next >` date navigation with a *"Jump to Today"* reset button on all section pages:
  - Users can view and check off tasks for **Today**.
  - Moving to **Tomorrow** demonstrates the automatic recurring reset (clean 0% state).
  - Moving to **Yesterday** shows past completion logs.
* **Date-Aware Logging Endpoints**: Updated backend `POST /api/logs/{id}/toggle` and `POST /api/logs/{id}/increment` to accept optional `target_date` query parameters, preserving exact daily/weekly/monthly history.
* **Interactive Dashboard Focus**: "Today's Focus" list on the Dashboard features interactive checkmark buttons that toggle daily missions directly from the home screen and immediately update overall progress.