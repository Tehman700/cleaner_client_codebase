import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import AnalyticsEvent, Plot, ScheduleEntry, Job, SystemMeta
from app.analytics_core import compute_summary, render_email_html
from app.email_utils import send_email

router = APIRouter(prefix="/analytics", tags=["analytics"])

RESET_INTERVAL_DAYS = int(os.getenv("RESET_INTERVAL_DAYS", "14"))
RESET_SCOPE = os.getenv("RESET_SCOPE", "analytics")  # "analytics" (events only) or "all" (whole DB)


# ── Auth helpers ──────────────────────────────────────────────────────────────

def _check_token(token: str = Query(..., description="Auth token from /tracking/login")):
    from app.routers.tracking import verify_token
    if not verify_token(token):
        raise HTTPException(status_code=403, detail="Invalid or missing token")


def _check_cron(secret: Optional[str] = None,
                x_cron_secret: Optional[str] = Header(None)):
    expected = os.getenv("CRON_SECRET", "")
    provided = secret or x_cron_secret
    if not expected or provided != expected:
        raise HTTPException(status_code=403, detail="Invalid cron secret")


# ── Event logging (public) ────────────────────────────────────────────────────

class EventIn(BaseModel):
    event_type: str
    role: Optional[str] = None
    metadata: Optional[dict] = None


@router.post("/event", status_code=201)
def log_event(body: EventIn, db: Session = Depends(get_db)):
    ev = AnalyticsEvent(event_type=body.event_type, role=body.role)
    ev.meta = body.metadata or {}
    db.add(ev)
    db.commit()
    return {"ok": True}


# ── Dashboard summary (token protected, supports filters) ─────────────────────

@router.get("/summary", dependencies=[Depends(_check_token)])
def get_summary(
    db: Session = Depends(get_db),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    granularity: str = Query("day"),
):
    return compute_summary(
        db,
        date_from=date_from,
        date_to=date_to,
        event_type=event_type or None,
        role=role or None,
        granularity=granularity if granularity in ("day", "month") else "day",
    )


# ── Scheduled: email the daily report (cron protected) ────────────────────────

@router.post("/email-report")
def email_report(_: None = Depends(_check_cron), db: Session = Depends(get_db)):
    summary = compute_summary(db, granularity="day")
    html, text = render_email_html(summary)
    subject = f"CleanTracking Analytics — {summary['generated_at'][:10]}"
    try:
        send_email(subject, html, text)
    except Exception as e:
        # Surface the real reason (e.g. SMTP auth failure) — this endpoint is
        # protected by CRON_SECRET, so returning the detail is safe.
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")
    return {"ok": True, "emailed": True, "total_events": summary["total"]}


# ── Scheduled: wipe data every N days (cron protected) ────────────────────────

def _wipe(db: Session) -> dict:
    deleted = {}
    if RESET_SCOPE == "all":
        deleted["jobs"]     = db.query(Job).delete()
        deleted["schedule"] = db.query(ScheduleEntry).delete()
        deleted["plots"]    = db.query(Plot).delete()
    deleted["analytics_events"] = db.query(AnalyticsEvent).delete()

    meta = db.query(SystemMeta).filter(SystemMeta.key == "last_reset_at").first()
    now_iso = datetime.utcnow().isoformat()
    if meta:
        meta.value = now_iso
    else:
        db.add(SystemMeta(key="last_reset_at", value=now_iso))
    db.commit()
    return deleted


@router.post("/reset")
def reset_now(_: None = Depends(_check_cron), db: Session = Depends(get_db)):
    """Force an immediate wipe (used for testing/manual reset)."""
    deleted = _wipe(db)
    return {"ok": True, "wiped": deleted, "scope": RESET_SCOPE}


@router.post("/maybe-reset")
def maybe_reset(_: None = Depends(_check_cron), db: Session = Depends(get_db)):
    """Wipe only if RESET_INTERVAL_DAYS have elapsed since the last reset.
    Called daily by the scheduler; performs the wipe on the 14-day boundary."""
    meta = db.query(SystemMeta).filter(SystemMeta.key == "last_reset_at").first()
    now = datetime.utcnow()

    if not meta or not meta.value:
        # First run — record the starting point, don't wipe yet
        if meta:
            meta.value = now.isoformat()
        else:
            db.add(SystemMeta(key="last_reset_at", value=now.isoformat()))
        db.commit()
        return {"ok": True, "reset": False, "reason": "initialised marker"}

    last = datetime.fromisoformat(meta.value)
    elapsed = (now - last).days
    if elapsed >= RESET_INTERVAL_DAYS:
        deleted = _wipe(db)
        return {"ok": True, "reset": True, "elapsed_days": elapsed, "wiped": deleted, "scope": RESET_SCOPE}

    return {"ok": True, "reset": False, "elapsed_days": elapsed,
            "next_in_days": RESET_INTERVAL_DAYS - elapsed}
