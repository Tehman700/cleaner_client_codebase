from pydantic import BaseModel
from typing import Optional


# ── Auth ──────────────────────────────────────────────────────────────────────

class AuthRequest(BaseModel):
    role: str   # "cleaner" | "admin"
    pin: str


class AuthResponse(BaseModel):
    success: bool
    role: Optional[str] = None


# ── Plot ──────────────────────────────────────────────────────────────────────

class PlotCreate(BaseModel):
    name: str
    address: str = ""
    tasks: list[str]


class PlotUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    tasks: Optional[list[str]] = None


class PlotOut(BaseModel):
    id: str
    name: str
    address: str
    tasks: list[str]

    model_config = {"from_attributes": True}


# ── Schedule ──────────────────────────────────────────────────────────────────

class ScheduleCreate(BaseModel):
    day: str
    plot_id: str


class ScheduleOut(BaseModel):
    id: str
    day: str
    plot_id: str

    model_config = {"from_attributes": True}


# ── Job ───────────────────────────────────────────────────────────────────────

class JobUpdate(BaseModel):
    tasks: Optional[dict] = None
    photo: Optional[str] = None      # base64 data URL or null to clear
    photo_name: Optional[str] = None


class JobOut(BaseModel):
    day: str
    plot_id: str
    tasks: dict
    photo: Optional[str] = None
    photo_name: Optional[str] = None

    model_config = {"from_attributes": True}
