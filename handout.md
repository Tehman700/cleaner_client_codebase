# CleanTracking — Project Handout

A complete reference for the CleanTracking window-cleaning job management system: what it is, how it is built, how to run it locally, and how to deploy and maintain it.

---

## 1. Overview

**CleanTracking** is a two-role web app for managing window-cleaning jobs.

- **Admin** creates properties ("plots"), defines the tasks for each, and schedules them across the week. The admin monitors progress and reviews signed documents uploaded by cleaners.
- **Cleaner** logs in, sees the jobs scheduled for today, checks off each task, and uploads a photo of the site manager's signed document once all tasks are complete.

### The original problem (now fixed)

The first version stored everything in the browser's **localStorage**. That meant data lived only on the device that created it — if the admin scheduled a job on their laptop, the cleaner could not see it on their phone. This rebuild replaces localStorage with a **shared backend + database**, so every device sees the same live data.

---

## 2. Architecture

```
┌─────────────────────┐         HTTPS / REST          ┌──────────────────────┐
│   Netlify (CDN)     │  ───────────────────────────► │   Render (Web Svc)   │
│   React frontend    │   /auth /plots /schedule      │   FastAPI backend    │
│   (static build)    │   /jobs /analytics /tracking  │   (Python + UV)      │
└─────────────────────┘                               └──────────┬───────────┘
        ▲                                                         │
        │                                                         ▼
        │                                              ┌──────────────────────┐
        │                                              │   Neon (PostgreSQL)  │
        │                                              │   persistent data    │
        │                                              └──────────────────────┘
        │
┌───────┴───────────────┐   scheduled HTTPS calls
│   GitHub Actions      │   • daily email report (via Gmail)
│   (cron schedulers)   │   • 14-day analytics reset
│                       │   • keep-warm /health pings (09–16 PKT)
└───────────────────────┘
```

- **Frontend** — React + TypeScript, built by Vite, hosted on Netlify.
- **Backend** — FastAPI (Python 3.12), dependency-managed by UV, hosted on Render.
- **Database** — PostgreSQL hosted free on Neon (chosen because Render's free tier has no persistent disk for SQLite).
- **Schedulers** — GitHub Actions runs the daily analytics email, the 14-day reset, and the keep-warm pinger.

---

## 3. Tech Stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | React 19, TypeScript, Vite |
| Styling     | Plain CSS (Ethos Narrative editorial design system) |
| Fonts       | Epilogue (headlines), Hanken Grotesk (body), Material Symbols (icons) |
| Backend     | FastAPI, SQLAlchemy, Pydantic |
| Package mgr | UV (Python), npm (Node) |
| Database    | PostgreSQL (Neon) / SQLite (local dev) |
| Scheduling  | GitHub Actions (cron) |
| Email       | Gmail SMTP, sent from the GitHub Actions runner |
| Hosting     | Netlify (frontend), Render (backend), Neon (DB) |

---

## 4. Repository Structure

```
Fiverr Client/
├── .github/workflows/
│   ├── analytics-cron.yml         Daily (00:00 PKT): email report + 14-day reset
│   └── keep-warm.yml              Every 10 min, 09–16 PKT: ping /health
│
├── frontend/                       React + TypeScript app
│   ├── index.html                  Entry HTML + font links
│   ├── netlify.toml                Netlify build config
│   ├── vite.config.ts              Dev proxy to backend
│   └── src/
│       ├── App.tsx                 Root component, auth/screen state
│       ├── index.css               Full design system (Ethos Narrative)
│       ├── api/client.ts           Typed fetch wrapper for all endpoints
│       ├── context/AppContext.tsx  Global state + all data mutations
│       ├── types/index.ts          Shared TypeScript types
│       ├── utils/
│       │   ├── helpers.ts          day/date helpers, plotStatus
│       │   └── analytics.ts        fire-and-forget event tracker
│       └── components/
│           ├── CursorEffect.tsx    Animated custom cursor (dot + trailing ring)
│           ├── LoadingOverlay.tsx
│           ├── Lightbox.tsx
│           ├── auth/AuthScreen.tsx        PIN login (keyboard + verify spinner)
│           ├── admin/AdminScreen.tsx      Tab shell
│           ├── admin/OverviewTab.tsx
│           ├── admin/ScheduleTab.tsx
│           ├── admin/PlotsTab.tsx
│           ├── admin/DocumentsTab.tsx
│           ├── cleaner/CleanerScreen.tsx
│           ├── cleaner/JobCard.tsx        Task checklist + photo upload
│           ├── modals/PlotModal.tsx
│           ├── modals/ScheduleModal.tsx
│           └── shared/StatusBadge.tsx, DayPills.tsx
│
└── backend/                        FastAPI app
    ├── app/
    │   ├── main.py                 App entry, CORS, router wiring, /health, SPA serving
    │   ├── database.py             SQLAlchemy engine (Postgres/SQLite aware)
    │   ├── models.py               Plot, ScheduleEntry, Job, AnalyticsEvent, SystemMeta
    │   ├── schemas.py              Pydantic request/response models
    │   ├── analytics_core.py       Summary computation (filters, spikes, hourly) + email HTML
    │   └── routers/
    │       ├── auth.py             POST /auth/verify
    │       ├── plots.py            CRUD /plots
    │       ├── schedule.py         CRUD /schedule
    │       ├── jobs.py             GET/PUT /jobs/{day}/{plot_id}
    │       ├── analytics.py        event logging, summary, report HTML, reset
    │       └── tracking.py         analytics login + dashboard page
    ├── tracking.html               Protected analytics dashboard (served by backend)
    ├── pyproject.toml              UV project + dependencies
    ├── .env                        Secrets (NOT committed)
    └── .env.example                Template of required variables
```

> Note: there is also a local-only `analytics_traffic/` folder containing a standalone analytics dashboard. It is gitignored and never pushed.

---

## 5. Data Model

| Table              | Fields |
|--------------------|--------|
| `plots`            | id, name, address, tasks (JSON list of up to 4 task strings) |
| `schedule`         | id, day (Mon–Sat), plot_id |
| `jobs`             | key (`day__plotId`), day, plot_id, tasks (JSON map of done flags), photo (base64), photo_name |
| `analytics_events` | id, event_type, role, meta (JSON), created_at (UTC) |
| `system_meta`      | key, value — tiny key/value store; holds `last_reset_at` for the 14-day reset |

---

## 6. API Endpoints

### Auth
| Method | Path           | Description |
|--------|----------------|-------------|
| POST   | /auth/verify   | Verify role + PIN, returns `{ success, role }` |

### Plots
| Method | Path         | Description |
|--------|--------------|-------------|
| GET    | /plots       | List all plots |
| POST   | /plots       | Create a plot |
| PUT    | /plots/{id}  | Update a plot |
| DELETE | /plots/{id}  | Delete a plot (also clears it from schedule) |

### Schedule
| Method | Path             | Description |
|--------|------------------|-------------|
| GET    | /schedule        | List all schedule entries |
| POST   | /schedule        | Add a plot to a day |
| DELETE | /schedule/{id}   | Remove a schedule entry |

### Jobs
| Method | Path                     | Description |
|--------|--------------------------|-------------|
| GET    | /jobs/{day}              | Get all jobs for a day (batch — one request replaces N) |
| GET    | /jobs/{day}/{plot_id}    | Get task/photo state for a single plot |
| PUT    | /jobs/{day}/{plot_id}    | Update task completions or upload a photo |

### Analytics & Tracking
| Method | Path                          | Auth | Description |
|--------|-------------------------------|------|-------------|
| POST   | /analytics/event              | public | Log an event (fire-and-forget from frontend) |
| GET    | /analytics/summary            | dashboard token | Aggregated stats; supports filter query params (below) |
| GET    | /analytics/report.html        | cron secret | Rendered HTML report (used by the email workflow) |
| POST   | /analytics/maybe-reset        | cron secret | Wipes analytics only if 14 days have elapsed |
| POST   | /analytics/reset              | cron secret | Force-wipe immediately (manual/testing) |
| POST   | /tracking/login               | public | Username/password → dashboard auth token |
| GET    | /tracking                     | public page | Serves the analytics dashboard HTML |
| GET    | /health                       | public | Returns `{status: ok}`; used by keep-warm pings (no DB hit) |

**`/analytics/summary` filter query params:** `token` (required), `date_from`, `date_to` (YYYY-MM-DD, local PKT), `event_type`, `role`, `granularity` (`day` | `month`).

Day values used throughout: `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`.

---

## 7. Authentication & Credentials

There is no user database — access is gated by **PINs** (the app), a **dashboard username/password** (analytics), and a **shared cron secret** (scheduled jobs). All live in environment variables / repo secrets, never hard-coded.

### Backend env vars (Render)
| Variable            | Used for | Default |
|---------------------|----------|---------|
| `ADMIN_PIN`         | Admin login in the app | `9999` (dev) |
| `CLEANER_PIN`       | Cleaner login in the app | `1234` (dev) |
| `TRACKING_USER`     | Analytics dashboard login | — |
| `TRACKING_PASSWORD` | Analytics dashboard login | — |
| `TRACKING_SECRET`   | Signs the dashboard auth token | — |
| `CRON_SECRET`       | Authorises scheduled report/reset calls (must match the GitHub secret) | — |
| `DATABASE_URL`      | DB connection string (Neon) | sqlite (dev) |
| `TZ_OFFSET_HOURS`   | Local timezone offset for bucketing analytics | `5` (Pakistan) |
| `RESET_INTERVAL_DAYS` | Days between auto-resets | `14` |
| `RESET_SCOPE`       | `analytics` (events only) or `all` (whole DB) | `analytics` |
| `ALLOWED_ORIGINS`   | CORS allow-list (optional; defaults to `*` + any `*.netlify.app`) | `*` |

### GitHub repo secrets (for the workflows)
| Secret              | Used for |
|---------------------|----------|
| `CRON_SECRET`       | Must equal the Render `CRON_SECRET` |
| `GMAIL_USER`        | Sending Gmail address (`tehmanhassan@gmail.com`) |
| `GMAIL_APP_PASSWORD`| Gmail **App Password** (16 chars, 2FA required) for that account |

### Frontend env var (Netlify)
| Variable        | Used for |
|-----------------|----------|
| `VITE_API_URL`  | Full backend URL the frontend calls |

The real `.env` is gitignored. `.env.example` shows the required keys with placeholder values.

---

## 8. Analytics

### Events tracked
Every meaningful action fires a silent event to `POST /analytics/event`:

| Event              | Fired when |
|--------------------|------------|
| `login`            | Admin or cleaner logs in |
| `task_completed`   | A task is checked/unchecked |
| `photo_uploaded`   | A signed document is uploaded |
| `plot_created`     | Admin adds a plot |
| `plot_updated`     | Admin edits a plot |
| `plot_deleted`     | Admin deletes a plot |
| `schedule_added`   | Admin schedules a job |
| `schedule_removed` | Admin removes a schedule entry |

### The dashboard (`/tracking`)
Open **`https://<backend-url>/tracking`**, log in with `TRACKING_USER` / `TRACKING_PASSWORD`. The dashboard provides:

- **Filters** — date range (from/to), event type, role, and a **Daily / Monthly** granularity toggle.
- **Stat cards** — total events, today's count, average per bucket, peak bucket.
- **Main traffic chart** — bar chart per day (or per month), with **spike bars highlighted in red**.
- **Spike detection** — buckets exceeding the mean + 1.5×std are flagged as spikes.
- **Peak Hours** — distribution by hour of day (PKT).
- **By Weekday** — distribution across Mon–Sun.
- **Event breakdown** + **recent activity** log.

All time bucketing respects `TZ_OFFSET_HOURS` (events are stored in UTC, displayed/bucketed in PKT).

### Daily email report (Option A — sent from GitHub Actions)
**Why not from the backend?** Render (and most PaaS hosts) **block outbound SMTP ports** (25/465/587) as an anti-spam measure, so the backend cannot send mail directly — this was confirmed by an `OSError: Network is unreachable` on port 587. GitHub Actions runners are **not** SMTP-blocked, so the email is sent from there instead.

**Flow:** the `analytics-cron.yml` workflow runs daily at 00:00 PKT → wakes the backend → fetches the pre-rendered HTML from `GET /analytics/report.html` → sends it via Gmail SMTP using `dawidd6/action-send-mail` → from `tehmanhassan@gmail.com` to `wguru2107@gmail.com`.

### 14-day auto-reset (analytics only)
- Driven by `POST /analytics/maybe-reset`, called daily by the same workflow.
- The backend stores `last_reset_at` in `system_meta`. The endpoint wipes **only when ≥ `RESET_INTERVAL_DAYS` (14)** have elapsed; otherwise it does nothing.
- With `RESET_SCOPE=analytics` (the default), **only the `analytics_events` table is wiped** — plots, schedule, and jobs are preserved. (Set `RESET_SCOPE=all` to wipe the whole DB instead.)

---

## 9. Scheduled Jobs (GitHub Actions)

Two workflows live in `.github/workflows/`. Both run on UTC; Pakistan is UTC+5.

### `analytics-cron.yml` — "Analytics Daily Email"
- **Schedule:** `0 19 * * *` (19:00 UTC = **00:00 PKT**).
- **Steps:** wake `/health` → compute PKT date → fetch `/analytics/report.html?secret=CRON_SECRET` → send via Gmail → `POST /analytics/maybe-reset`.
- **Secrets used:** `CRON_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`.

### Keep-warm — cron-job.org (replaced GitHub Actions)
The `keep-warm.yml` GitHub Actions workflow has been **removed**. Keep-warm pinging is now handled by **[cron-job.org](https://cron-job.org)** (free, more precise timing — GitHub Actions can drift several minutes under load).

**cron-job.org setup:**
- **URL:** `https://cleaner-client-codebase.onrender.com/health`
- **Crontab expression:** `*/10 7-17 * * *`
- **What this means:** every 10 minutes, UTC 07:00–17:59 = **08:00–18:59 BST** (UK business hours + 1 hr buffer each side, valid for BST — clocks back to GMT in late October, at which point adjust to `*/10 8-18 * * *` if needed)
- **No secrets needed** (the endpoint is public and touches no DB).

**Keep-warm cost:** ~330 Render instance-hours/month (≈ **44%** of the free 750 hrs), $0, zero Neon load.

---

## 10. Design System — "Ethos Narrative"

Editorial Minimalism: quiet authority, high contrast, generous whitespace.

- **Background** — warm off-white `#fbf9f7`
- **Primary** — pure black `#000000`
- **Typography** — Epilogue (large uppercase headlines, tight tracking) + Hanken Grotesk (body, uppercase labels)
- **Shape** — strictly sharp, 0px radius everywhere
- **Depth** — no shadows; 1px subtle borders and tonal layers only
- **Buttons** — solid black, invert to outline on hover
- **Inputs** — bottom-border only, uppercase labels
- **Animated cursor** — a small solid dot tracks the pointer exactly; a larger ring trails behind with eased motion and expands over interactive elements. Auto-disabled on touch devices.

### PIN login behaviour (notable fixes)
- **Keyboard support** — number keys / numpad enter digits; Backspace/Delete removes them.
- **Verifying state** — a spinner + "Verifying…" shows while the PIN is checked, so the (sometimes slow, cold-starting) backend no longer looks frozen.
- **Backspace during verify** — works even mid-request; it cancels the in-flight attempt (via an attempt guard) so you can immediately retype.
- **No stale-closure bug** — digit entry uses functional state updates and submit is triggered by an effect on the 4th digit, fixing intermittent miscounts when typing fast.

---

## 11. Running Locally

### Prerequisites
- Python 3.12+
- Node.js 18+
- UV (`pip install uv`)

### Backend (Terminal 1)
```bash
cd backend
cp .env.example .env        # then edit .env and set your own PIN/credentials
uv sync
uv run uvicorn app.main:app --reload
```
Runs at `http://localhost:8000`.

### Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`. Vite proxies `/auth`, `/plots`, `/schedule`, `/jobs`, `/analytics`, `/tracking` to the backend automatically, so there are no CORS issues in development.

> **Workflow rule:** always test UI changes locally with `npm run dev` before pushing, so broken builds never reach Netlify.

---

## 12. Deployment

### Backend → Render
1. New Web Service, connect the GitHub repo.
2. Root directory: `backend`
3. Build command: `pip install uv && uv sync`
4. Start command: `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Environment variables (see §7): `ADMIN_PIN`, `CLEANER_PIN`, `TRACKING_USER`, `TRACKING_PASSWORD`, `TRACKING_SECRET`, `CRON_SECRET`, `DATABASE_URL`. Optional: `TZ_OFFSET_HOURS`, `RESET_INTERVAL_DAYS`, `RESET_SCOPE` (defaults already match Pakistan / 14-day / analytics-only).

### Database → Neon
1. Create a free project at neon.tech.
2. Copy the connection string (`postgresql://...?sslmode=require`).
3. Paste it as `DATABASE_URL` in Render. Tables are created automatically on first boot.

### Frontend → Netlify
1. Import the GitHub repo.
2. Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `frontend/dist`
5. Environment variable: `VITE_API_URL = https://<your-render-url>` (no trailing slash).

### Schedulers → GitHub
1. Repo → Settings → Secrets and variables → Actions → add `CRON_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`.
2. Generate the Gmail App Password while logged into `tehmanhassan@gmail.com` (2-Step Verification must be ON): https://myaccount.google.com/apppasswords
3. Workflows run automatically; you can also trigger them manually from the **Actions** tab → **Run workflow**.

---

## 13. Making Changes Later

The repo is connected to both Netlify and Render with auto-deploy on push to `main`:

```bash
# 1. make your changes
# 2. test locally (npm run dev + uvicorn)
# 3. then:
git add .
git commit -m "describe the change"
git push
```

- A push that touches `frontend/` triggers a Netlify rebuild (~1–2 min).
- A push that touches `backend/` triggers a Render redeploy.

### Common gotcha — TypeScript strictness
Netlify's build (`tsc -b && vite build`) is stricter than the dev server. Before pushing frontend changes, run a production build locally to catch errors early:
```bash
cd frontend
npm run build
```
Unused variables/imports and implicit-any indexing will fail the Netlify build but not the dev server.

---

## 14. Live URLs & Repo

| Resource          | URL |
|-------------------|-----|
| GitHub repo       | https://github.com/Tehman700/cleaner_client_codebase |
| Frontend (Netlify)| https://cleaningtracker123.netlify.app |
| Backend (Render)  | https://cleaner-client-codebase.onrender.com |
| Analytics dashboard | https://cleaner-client-codebase.onrender.com/tracking |

> **Render free-tier note:** the backend sleeps after ~15 minutes of inactivity and takes ~30–50 seconds to wake on the first request. The **cron-job.org keep-warm** mitigates this during UK business hours. A paid Render tier would keep it always-on.

---

## 15. Performance Optimisations Applied

The following changes were made after the initial build to reduce latency and improve reliability.

### Neon pooled connection (manual step — env var only)
Switch `DATABASE_URL` in Render's environment variables to Neon's **pooled connection string** (port 6432, PgBouncer). This prevents Neon compute cold starts between requests. Both URLs are available in the Neon dashboard under "Connection string" → toggle "Pooled connection".

### DB engine pool settings (`backend/app/database.py`)
For PostgreSQL, the SQLAlchemy engine is now created with explicit pool settings:
- `pool_size=5`, `max_overflow=10` — controls concurrent connections
- `pool_pre_ping=True` — auto-reconnects stale connections after Neon idle timeouts
- `pool_recycle=300` — recycles connections every 5 minutes before Neon drops them

### Analytics events as background task (`backend/app/routers/analytics.py`)
`POST /analytics/event` now returns `{"ok": true}` immediately and writes to the DB in a FastAPI `BackgroundTask`. Every user action (task tick, login, photo upload) was previously blocked on this DB write — it now adds zero latency to the hot path.

### Batch jobs endpoint (`backend/app/routers/jobs.py` + frontend)
Added `GET /jobs/{day}` which queries the schedule and returns all job records for a day in a single request. The frontend (`AppContext.tsx`) now calls this one endpoint instead of firing one `GET /jobs/{day}/{plot_id}` per scheduled plot. Reduces N round trips to 1 every time a day is loaded.

### Cache-Control on stable endpoints (`backend/app/routers/plots.py`, `schedule.py`)
`GET /plots` and `GET /schedule` now return `Cache-Control: max-age=60, private`. These two lists rarely change during a working day; the browser serves them from cache on repeat calls, eliminating two round trips per page load.

---

## 16. Known Limitations / Future Improvements

- **Photos** are stored as base64 strings in the database. For heavy use, move to object storage (S3 / Cloudflare R2).
- **PINs/passwords** are compared as plain strings. For higher security, hash them (e.g. bcrypt) and add **rate limiting on `/auth/verify`** (the 4-digit PIN = only 10,000 combinations, so it is brute-forceable without a limit).
- **Single tenant** — one admin PIN and one cleaner PIN shared by the team; there are no individual user accounts.
- **Cold starts** on Render's free tier outside the keep-warm window (see note above).
- **Email depends on GitHub Actions** (Render cannot send SMTP). If the repo goes 60+ days without commits, GitHub pauses the schedules until the next commit or manual run.
