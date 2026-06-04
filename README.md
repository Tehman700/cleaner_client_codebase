# CleanTrack

A window cleaning job management system with two roles: Admin and Cleaner. The Admin schedules jobs and monitors progress from any device. Cleaners check off tasks and upload signed documents on-site. All data is stored on a shared backend so every device sees the same state in real time.

---

## The Problem This Solves

The original app used the browser's localStorage to store all data. This meant every change (plots, schedules, completed tasks, uploaded photos) was only visible on the device that made it. If the admin scheduled a job on their laptop, the cleaner could not see it on their phone. This project replaces localStorage with a REST API backed by a database so all devices share the same data.

---

## Tech Stack

**Frontend**
- React 18 with TypeScript
- Vite (dev server and build tool)
- Plain CSS (no CSS framework)
- Deployed on Netlify

**Backend**
- Python 3.12
- FastAPI
- SQLAlchemy with SQLite
- UV for dependency management
- Deployed on Render

---

## Project Structure

```
.
├── frontend/                   React + TypeScript app
│   ├── src/
│   │   ├── App.tsx             Root component, auth state
│   │   ├── index.css           Global styles
│   │   ├── api/
│   │   │   └── client.ts       Typed API client (fetch wrapper)
│   │   ├── context/
│   │   │   └── AppContext.tsx  Global state and all API calls
│   │   ├── types/
│   │   │   └── index.ts        Shared TypeScript types
│   │   ├── utils/
│   │   │   └── helpers.ts      Date/day helpers, plotStatus
│   │   └── components/
│   │       ├── auth/           PIN login screen
│   │       ├── admin/          Admin dashboard (4 tabs)
│   │       ├── cleaner/        Cleaner job view
│   │       ├── modals/         Plot and schedule modals
│   │       └── shared/         StatusBadge, DayPills
│   ├── netlify.toml            Netlify build config
│   └── vite.config.ts          Dev proxy to backend
│
└── backend/                    FastAPI app
    ├── app/
    │   ├── main.py             App entry point, CORS, router wiring
    │   ├── database.py         SQLAlchemy engine and session
    │   ├── models.py           Plot, ScheduleEntry, Job ORM models
    │   ├── schemas.py          Pydantic request/response schemas
    │   └── routers/
    │       ├── auth.py         POST /auth/verify
    │       ├── plots.py        CRUD /plots
    │       ├── schedule.py     CRUD /schedule
    │       └── jobs.py         GET/PUT /jobs/{day}/{plot_id}
    ├── pyproject.toml          UV project config and dependencies
    ├── .env                    Local secrets (not committed)
    └── .env.example            Template showing required variables
```

---

## Local Development

### Requirements

- Python 3.12+
- Node.js 18+
- UV (`pip install uv` or see https://docs.astral.sh/uv/getting-started/installation/)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set your own PINs
uv sync
uv run uvicorn app.main:app --reload
```

The API will be running at `http://localhost:8000`.

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:5173`.

Vite proxies all API requests (`/auth`, `/plots`, `/schedule`, `/jobs`) to `localhost:8000` automatically, so no CORS configuration is needed during development.

### Default PINs (local only)

| Role    | PIN                        |
|---------|----------------------------|
| Admin   | set in `backend/.env`      |
| Cleaner | set in `backend/.env`      |

Change these in `backend/.env` before deploying.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                          | Example                          |
|----------------|--------------------------------------|----------------------------------|
| `ADMIN_PIN`    | 4-digit PIN for the admin role       | any 4-digit number               |
| `CLEANER_PIN`  | 4-digit PIN for the cleaner role     | any 4-digit number               |
| `DATABASE_URL` | SQLAlchemy database connection URL   | `sqlite:///./cleantrack.db`      |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins (optional, defaults to `*`) | `https://yourapp.netlify.app` |

### Frontend

| Variable        | Description                                         |
|-----------------|-----------------------------------------------------|
| `VITE_API_URL`  | Full URL of the deployed backend. Leave empty in dev (Vite proxy handles it). |

---

## API Endpoints

### Auth

| Method | Path           | Description                        |
|--------|----------------|------------------------------------|
| POST   | /auth/verify   | Verify role + PIN, returns success |

### Plots

| Method | Path           | Description              |
|--------|----------------|--------------------------|
| GET    | /plots         | List all plots           |
| POST   | /plots         | Create a plot            |
| PUT    | /plots/{id}    | Update a plot            |
| DELETE | /plots/{id}    | Delete a plot            |

### Schedule

| Method | Path               | Description                        |
|--------|--------------------|------------------------------------|
| GET    | /schedule          | List all schedule entries          |
| POST   | /schedule          | Add a plot to a day                |
| DELETE | /schedule/{id}     | Remove an entry from the schedule  |

### Jobs

| Method | Path                        | Description                              |
|--------|-----------------------------|------------------------------------------|
| GET    | /jobs/{day}/{plot_id}       | Get task/photo state for a job           |
| PUT    | /jobs/{day}/{plot_id}       | Update task completions or upload photo  |

Day values: `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`

---

## How the App Works

### Roles

**Admin**
- Logs in with the admin PIN
- Creates and manages plots (properties), each with up to 4 tasks
- Schedules plots to days of the week
- Views the overview dashboard: how many jobs are complete vs remaining
- Views uploaded signed documents from cleaners

**Cleaner**
- Logs in with the cleaner PIN
- Sees only today's scheduled jobs
- Checks off tasks one by one
- Once all tasks are done, an upload zone appears to photograph the site manager's signed document
- The photo is stored on the backend and visible to the admin immediately

### Data Flow

All state lives in the backend database. On login, the frontend loads plots, schedule, and today's jobs in a single sequence. Task toggles use optimistic updates (the UI responds immediately) and sync to the backend in the background. If the sync fails, the change is reverted and an alert is shown.

---

## Deployment

### Backend on Render

1. Create a new Web Service on Render and connect the GitHub repository.
2. Set the root directory to `backend`.
3. Set the build command to `pip install uv && uv sync`.
4. Set the start command to `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add a Disk with mount path `/data`.
6. Set the following environment variables in Render:

```
ADMIN_PIN=your_admin_pin
CLEANER_PIN=your_cleaner_pin
DATABASE_URL=sqlite:////data/cleantrack.db
```

After deploying, note the service URL (e.g. `https://cleantrack-api.onrender.com`).

### Frontend on Netlify

1. Connect the repository on Netlify.
2. Set the base directory to `frontend`.
3. Set the build command to `npm run build`.
4. Set the publish directory to `frontend/dist`.
5. Add an environment variable:

```
VITE_API_URL=https://cleantrack-api.onrender.com
```

6. Deploy. The existing site at `cleaningtracker123.netlify.app` can be redeployed by pointing it at this repository.

---

## Notes

- The SQLite database file is created automatically on first run. No migration step is needed.
- Photos are stored as base64 data URLs inside the database. For a large number of users, switching to file/object storage (S3, Cloudflare R2) would be the next step.
- PINs are compared as plain strings. For higher security, store them as hashed values using bcrypt.
- The app is designed for a single team (one admin, one or more cleaners sharing a PIN). It does not support multiple separate tenants.
