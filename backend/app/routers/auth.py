import os
from fastapi import APIRouter
from app.schemas import AuthRequest, AuthResponse

router = APIRouter(prefix="/auth", tags=["auth"])

PINS = {
    "cleaner": os.getenv("CLEANER_PIN", "1234"),
    "admin":   os.getenv("ADMIN_PIN",   "9999"),
}


@router.post("/verify", response_model=AuthResponse)
def verify_pin(body: AuthRequest):
    expected = PINS.get(body.role)
    if expected and body.pin == expected:
        return AuthResponse(success=True, role=body.role)
    return AuthResponse(success=False)
