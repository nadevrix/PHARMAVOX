from pydantic import BaseModel
from typing import List

class ReminderItem(BaseModel):
    time: str
    voice_reminder_text: str

class SchedulePlan(BaseModel):
    medication_name: str
    duration_days: int
    interval_hours: int
    daily_tome_times: List[str]
    reminders: List[ReminderItem]

class ScheduleRequest(BaseModel):
    medication_name: str
    instructions: str

class ScheduleResponse(BaseModel):
    schedule_plan: SchedulePlan
