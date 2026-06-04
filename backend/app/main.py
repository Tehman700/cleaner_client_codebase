import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.routers import auth, plots, schedule, jobs

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CleanTrack API", version="1.0.0")

# Production build lives in frontend/dist after `npm run build`
DIST_DIR = Path(__file__).parent.parent.parent / "frontend" / "dist"

_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(plots.router)
app.include_router(schedule.router)
app.include_router(jobs.router)


@app.get("/health")
def health():
    return {"status": "ok"}


# Only serve the built frontend in production (when dist/ exists)
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(_: str):
        return FileResponse(DIST_DIR / "index.html")
