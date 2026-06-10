from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Job, ScheduleEntry
from app.schemas import JobUpdate, JobOut

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _job_key(day: str, plot_id: str) -> str:
    return f"{day}__{plot_id}"


def _get_or_create(day: str, plot_id: str, db: Session) -> Job:
    key = _job_key(day, plot_id)
    job = db.query(Job).filter(Job.key == key).first()
    if not job:
        job = Job(key=key, day=day, plot_id=plot_id)
        job.tasks = {}
        db.add(job)
        db.commit()
        db.refresh(job)
    return job


def _to_out(job: Job) -> JobOut:
    return JobOut(
        day=job.day,
        plot_id=job.plot_id,
        tasks=job.tasks,
        photo=job.photo,
        photo_name=job.photo_name,
    )


@router.get("/{day}", response_model=list[JobOut])
def get_jobs_for_day(day: str, db: Session = Depends(get_db)):
    try:
        dow = datetime.strptime(day, "%Y-%m-%d").strftime("%a")  # "2026-06-13" → "Fri"
    except ValueError:
        raise HTTPException(status_code=400, detail="day must be YYYY-MM-DD")
    entries = db.query(ScheduleEntry).filter(ScheduleEntry.day == dow).all()
    return [_to_out(_get_or_create(day, e.plot_id, db)) for e in entries]


@router.get("/{day}/{plot_id}", response_model=JobOut)
def get_job(day: str, plot_id: str, db: Session = Depends(get_db)):
    job = _get_or_create(day, plot_id, db)
    return _to_out(job)


@router.put("/{day}/{plot_id}", response_model=JobOut)
def update_job(day: str, plot_id: str, body: JobUpdate, db: Session = Depends(get_db)):
    job = _get_or_create(day, plot_id, db)
    if body.tasks is not None:
        job.tasks = body.tasks
    if body.photo is not None:
        job.photo = body.photo if body.photo != "" else None
        job.photo_name = body.photo_name
    db.commit()
    db.refresh(job)
    return _to_out(job)
