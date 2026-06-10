import uuid
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Plot
from app.schemas import PlotCreate, PlotUpdate, PlotOut

router = APIRouter(prefix="/plots", tags=["plots"])


def _to_out(plot: Plot) -> PlotOut:
    return PlotOut(id=plot.id, name=plot.name, address=plot.address, tasks=plot.tasks)


@router.get("", response_model=list[PlotOut])
def list_plots(response: Response, db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "max-age=60, private"
    return [_to_out(p) for p in db.query(Plot).all()]


@router.post("", response_model=PlotOut, status_code=201)
def create_plot(body: PlotCreate, db: Session = Depends(get_db)):
    plot = Plot(id=str(uuid.uuid4()), name=body.name, address=body.address)
    plot.tasks = body.tasks
    db.add(plot)
    db.commit()
    db.refresh(plot)
    return _to_out(plot)


@router.put("/{plot_id}", response_model=PlotOut)
def update_plot(plot_id: str, body: PlotUpdate, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    if body.name is not None:
        plot.name = body.name
    if body.address is not None:
        plot.address = body.address
    if body.tasks is not None:
        plot.tasks = body.tasks
    db.commit()
    db.refresh(plot)
    return _to_out(plot)


@router.delete("/{plot_id}", status_code=204)
def delete_plot(plot_id: str, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    db.delete(plot)
    db.commit()
