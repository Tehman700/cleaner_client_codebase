"""Shared analytics computation: used by both the dashboard API and the
scheduled email report. Buckets events by a configurable local timezone
offset (default Pakistan, UTC+5)."""

import os
import statistics
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional

from sqlalchemy.orm import Session
from app.models import AnalyticsEvent

TZ_OFFSET_HOURS = int(os.getenv("TZ_OFFSET_HOURS", "5"))  # Pakistan = +5


def _local(dt: datetime) -> datetime:
    return dt + timedelta(hours=TZ_OFFSET_HOURS)


def _now_local() -> datetime:
    return _local(datetime.utcnow())


def compute_summary(
    db: Session,
    *,
    date_from: Optional[str] = None,   # "YYYY-MM-DD" (local)
    date_to: Optional[str] = None,     # "YYYY-MM-DD" (local)
    event_type: Optional[str] = None,
    role: Optional[str] = None,
    granularity: str = "day",          # "day" | "month"
) -> dict:
    q = db.query(AnalyticsEvent)
    if event_type:
        q = q.filter(AnalyticsEvent.event_type == event_type)
    if role:
        q = q.filter(AnalyticsEvent.role == role)
    events = q.order_by(AnalyticsEvent.created_at.desc()).all()

    # Parse local date filter bounds
    df = datetime.strptime(date_from, "%Y-%m-%d").date() if date_from else None
    dt_ = datetime.strptime(date_to, "%Y-%m-%d").date() if date_to else None

    by_type: dict[str, int] = defaultdict(int)
    by_role: dict[str, int] = defaultdict(int)
    by_day:  dict[str, int] = defaultdict(int)
    by_month: dict[str, int] = defaultdict(int)
    by_hour: dict[int, int] = defaultdict(int)
    by_weekday: dict[int, int] = defaultdict(int)

    filtered = []
    for ev in events:
        if not ev.created_at:
            continue
        local_dt = _local(ev.created_at)
        d = local_dt.date()
        if df and d < df:
            continue
        if dt_ and d > dt_:
            continue
        filtered.append(ev)
        by_type[ev.event_type] += 1
        if ev.role:
            by_role[ev.role] += 1
        by_day[d.isoformat()] += 1
        by_month[local_dt.strftime("%Y-%m")] += 1
        by_hour[local_dt.hour] += 1
        by_weekday[local_dt.weekday()] += 1

    # ── Time series ──────────────────────────────────────────────
    today = _now_local().date()
    timeseries = []
    if granularity == "month":
        # last 12 months
        y, m = today.year, today.month
        months = []
        for _ in range(12):
            months.append(f"{y:04d}-{m:02d}")
            m -= 1
            if m == 0:
                m = 12; y -= 1
        for key in reversed(months):
            timeseries.append({"bucket": key, "count": by_month.get(key, 0)})
    else:
        # default: last 30 days (or the filtered range if smaller window given)
        span_end = dt_ or today
        span_start = df or (span_end - timedelta(days=29))
        cur = span_start
        # cap to 92 days to keep payload reasonable
        max_days = 92
        days_list = []
        while cur <= span_end and len(days_list) < max_days:
            days_list.append(cur)
            cur += timedelta(days=1)
        for d in days_list:
            timeseries.append({"bucket": d.isoformat(), "count": by_day.get(d.isoformat(), 0)})

    # ── Spike detection ──────────────────────────────────────────
    counts = [b["count"] for b in timeseries]
    avg = round(sum(counts) / len(counts), 2) if counts else 0
    std = round(statistics.pstdev(counts), 2) if len(counts) > 1 else 0
    threshold = avg + 1.5 * std if std > 0 else (max(counts) if counts else 0)
    spikes = [
        b for b in timeseries
        if b["count"] > 0 and b["count"] >= threshold and b["count"] > avg
    ]
    peak = max(timeseries, key=lambda b: b["count"]) if timeseries else None

    hourly  = [{"hour": h, "count": by_hour.get(h, 0)} for h in range(24)]
    weekday_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekday = [{"day": weekday_names[i], "count": by_weekday.get(i, 0)} for i in range(7)]

    today_key = today.isoformat()
    recent = [
        {
            "id":         ev.id,
            "event_type": ev.event_type,
            "role":       ev.role,
            "metadata":   ev.meta,
            "created_at": _local(ev.created_at).isoformat() if ev.created_at else None,
        }
        for ev in filtered[:60]
    ]

    return {
        "total":        len(filtered),
        "today_count":  by_day.get(today_key, 0),
        "by_type":      dict(by_type),
        "by_role":      dict(by_role),
        "granularity":  granularity,
        "timeseries":   timeseries,
        "spikes":       spikes,
        "peak":         peak,
        "avg_per_bucket": avg,
        "hourly":       hourly,
        "weekday":      weekday,
        "recent":       recent,
        "tz_offset":    TZ_OFFSET_HOURS,
        "generated_at": _now_local().isoformat(),
        "event_types":  sorted({e.event_type for e in events}),
        "roles":        sorted({e.role for e in events if e.role}),
    }
