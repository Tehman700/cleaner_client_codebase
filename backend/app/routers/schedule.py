import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ScheduleEntry
from app.schemas import ScheduleCreate, ScheduleOut

router = APIRouter(prefix="/schedule", tags=["schedule"])

VALID_DAYS = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat"}


@router.get("", response_model=list[ScheduleOut])
def list_schedule(db: Session = Depends(get_db)):
    # response.headers["Cache-Control"] = "max-age=60, private"
    return db.query(ScheduleEntry).all()


@router.post("", response_model=ScheduleOut, status_code=201)
def add_schedule(body: ScheduleCreate, db: Session = Depends(get_db)):
    if body.day not in VALID_DAYS:
        raise HTTPException(status_code=400, detail=f"Invalid day: {body.day}")
    duplicate = db.query(ScheduleEntry).filter(
        ScheduleEntry.day == body.day,
        ScheduleEntry.plot_id == body.plot_id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Plot already scheduled for that day")
    entry = ScheduleEntry(id=str(uuid.uuid4()), day=body.day, plot_id=body.plot_id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=204)
def remove_schedule(entry_id: str, db: Session = Depends(get_db)):
    entry = db.query(ScheduleEntry).filter(ScheduleEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Schedule entry not found")
    db.delete(entry)
    db.commit()
