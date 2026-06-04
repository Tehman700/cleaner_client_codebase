from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Job
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
