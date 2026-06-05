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


def render_email_html(summary: dict) -> tuple[str, str]:
    """Return (html, plain_text) for the daily report email."""
    by_type = summary["by_type"]
    by_role = summary["by_role"]
    ts = summary["timeseries"]
    spikes = summary["spikes"]

    rows_type = "".join(
        f"<tr><td style='padding:6px 14px;border-bottom:1px solid #eee'>{k.replace('_',' ').title()}</td>"
        f"<td style='padding:6px 14px;border-bottom:1px solid #eee;text-align:right;font-weight:700'>{v}</td></tr>"
        for k, v in sorted(by_type.items(), key=lambda x: -x[1])
    ) or "<tr><td style='padding:6px 14px'>No events</td><td></td></tr>"

    rows_recent = "".join(
        f"<tr><td style='padding:5px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#666'>{e['created_at'][:16].replace('T',' ')}</td>"
        f"<td style='padding:5px 12px;border-bottom:1px solid #f0f0f0;font-size:12px'>{e['event_type'].replace('_',' ')}</td>"
        f"<td style='padding:5px 12px;border-bottom:1px solid #f0f0f0;font-size:12px'>{e['role'] or '—'}</td></tr>"
        for e in summary["recent"][:15]
    )

    # simple ascii spark for last 14 buckets
    last = ts[-14:]
    mx = max((b["count"] for b in last), default=1) or 1
    blocks = "▁▂▃▄▅▆▇█"
    spark = "".join(blocks[min(len(blocks)-1, int((b["count"]/mx)*(len(blocks)-1)))] for b in last)

    spike_html = ""
    if spikes:
        items = "".join(f"<li><b>{s['bucket']}</b> — {s['count']} events</li>" for s in spikes[-5:])
        spike_html = f"<h3 style='margin:24px 0 8px'>Spikes detected</h3><ul style='color:#333'>{items}</ul>"

    html = f"""
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#1a1a1a">
      <h1 style="font-size:22px;margin:0 0 4px">CleanTracking — Daily Analytics</h1>
      <p style="color:#888;font-size:13px;margin:0 0 20px">Generated {summary['generated_at'][:16].replace('T',' ')} (PKT)</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr>
          <td style="padding:14px;border:1px solid #eee;text-align:center">
            <div style="font-size:28px;font-weight:800">{summary['total']}</div>
            <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px">Total Events</div>
          </td>
          <td style="padding:14px;border:1px solid #eee;text-align:center">
            <div style="font-size:28px;font-weight:800">{summary['today_count']}</div>
            <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px">Today</div>
          </td>
          <td style="padding:14px;border:1px solid #eee;text-align:center">
            <div style="font-size:28px;font-weight:800">{by_role.get('admin',0)}/{by_role.get('cleaner',0)}</div>
            <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px">Admin / Cleaner logins</div>
          </td>
        </tr>
      </table>

      <p style="font-size:13px;color:#555">Last 14 days: <span style="font-size:20px;letter-spacing:2px">{spark}</span></p>

      <h3 style="margin:24px 0 8px">Event breakdown</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eee">{rows_type}</table>

      {spike_html}

      <h3 style="margin:24px 0 8px">Recent activity</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eee">{rows_recent}</table>

      <p style="color:#aaa;font-size:11px;margin-top:28px">Automated report from CleanTracking analytics.</p>
    </div>
    """

    text = (
        f"CleanTracking Daily Analytics ({summary['generated_at'][:16]} PKT)\n"
        f"Total events: {summary['total']} | Today: {summary['today_count']}\n"
        + "\n".join(f"  {k}: {v}" for k, v in sorted(by_type.items(), key=lambda x: -x[1]))
    )
    return html, text
