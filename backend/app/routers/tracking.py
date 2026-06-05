import os
import hmac
import hashlib
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter(tags=["tracking"])

TRACKING_USER   = os.getenv("TRACKING_USER",   "admin")
TRACKING_PASS   = os.getenv("TRACKING_PASSWORD","changeme123")
TRACKING_SECRET = os.getenv("TRACKING_SECRET", "default_secret_change_me")

_HTML = Path(__file__).parent.parent.parent / "tracking.html"


def make_token(user: str, pwd: str) -> str:
    key = TRACKING_SECRET.encode()
    msg = f"{user}:{pwd}".encode()
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


def verify_token(token: str) -> bool:
    expected = make_token(TRACKING_USER, TRACKING_PASS)
    return hmac.compare_digest(token, expected)


class LoginBody(BaseModel):
    username: str
    password: str


@router.post("/tracking/login")
def tracking_login(body: LoginBody):
    if body.username == TRACKING_USER and body.password == TRACKING_PASS:
        return {"token": make_token(body.username, body.password)}
    raise HTTPException(status_code=401, detail="Invalid username or password")


@router.get("/tracking")
def tracking_page():
    return FileResponse(_HTML, media_type="text/html")