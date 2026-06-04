import json
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer
from app.database import Base


class Plot(Base):
    __tablename__ = "plots"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False, default="")
    # Stored as JSON array of strings, e.g. '["Clean windows", "Clean frames"]'
    tasks_json = Column(Text, nullable=False, default="[]")

    @property
    def tasks(self) -> list[str]:
        return json.loads(self.tasks_json)

    @tasks.setter
    def tasks(self, value: list[str]):
        self.tasks_json = json.dumps(value)


class ScheduleEntry(Base):
    __tablename__ = "schedule"

    id = Column(String, primary_key=True, index=True)
    day = Column(String, nullable=False)   # Mon/Tue/Wed/Thu/Fri/Sat
    plot_id = Column(String, nullable=False, index=True)


class Job(Base):
    __tablename__ = "jobs"

    # Composite natural key: "{day}__{plot_id}"
    key = Column(String, primary_key=True, index=True)
    day = Column(String, nullable=False)
    plot_id = Column(String, nullable=False)
    # Stored as JSON object: {"0": true, "1": false, ...}
    tasks_json = Column(Text, nullable=False, default="{}")
    photo = Column(Text, nullable=True)        # base64 data URL
    photo_name = Column(String, nullable=True)

    @property
    def tasks(self) -> dict:
        return json.loads(self.tasks_json)

    @tasks.setter
    def tasks(self, value: dict):
        self.tasks_json = json.dumps(value)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String, nullable=False, index=True)
    role       = Column(String, nullable=True)
    meta_json  = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    @property
    def meta(self) -> dict:
        return json.loads(self.meta_json) if self.meta_json else {}

    @meta.setter
    def meta(self, value: dict):
        self.meta_json = json.dumps(value) if value else None
