from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import AnalyticsEvent

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _check_token(token: str = Query(..., description="Auth token from /tracking/login")):
    from app.routers.tracking import verify_token
    if not verify_token(token):
        raise HTTPException(status_code=403, detail="Invalid or missing token")


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


@router.get("/summary", dependencies=[Depends(_check_token)])
def get_summary(db: Session = Depends(get_db)):
    all_events = db.query(AnalyticsEvent).order_by(AnalyticsEvent.created_at.desc()).all()

    by_type: dict[str, int] = defaultdict(int)
    by_role: dict[str, int] = defaultdict(int)
    daily:   dict[str, int] = defaultdict(int)

    for ev in all_events:
        by_type[ev.event_type] += 1
        if ev.role:
            by_role[ev.role] += 1
        day_str = ev.created_at.strftime("%Y-%m-%d") if ev.created_at else "unknown"
        daily[day_str] += 1

    today = datetime.utcnow().date()
    daily_chart = []
    for i in range(29, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        daily_chart.append({"date": d, "count": daily.get(d, 0)})

    recent = [
        {
            "id":         ev.id,
            "event_type": ev.event_type,
            "role":       ev.role,
            "metadata":   ev.meta,
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
        }
        for ev in all_events[:50]
    ]

    return {
        "total":       len(all_events),
        "by_type":     dict(by_type),
        "by_role":     dict(by_role),
        "daily_chart": daily_chart,
        "recent":      recent,
    }
