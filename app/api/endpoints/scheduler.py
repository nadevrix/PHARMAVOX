from fastapi import APIRouter
from app.schemas.scheduler import ScheduleRequest, ScheduleResponse, SchedulePlan, ReminderItem

router = APIRouter()

@router.post("/schedule", response_model=ScheduleResponse)
async def generate_schedule(request: ScheduleRequest):
    """
    Genera una agenda de dosificación de tomas y alarmas auditivas dinámicas
    a partir de las indicaciones de una receta o prospecto.
    """
    return ScheduleResponse(
        schedule_plan=SchedulePlan(
            medication_name=request.medication_name,
            duration_days=5,
            interval_hours=8,
            daily_tome_times=["08:00", "16:00", "00:00"],
            reminders=[
                ReminderItem(
                    time="08:00",
                    voice_reminder_text=f"Es hora de tu toma de {request.medication_name}."
                ),
                ReminderItem(
                    time="16:00",
                    voice_reminder_text=f"Recuerda tomar tu dosis de {request.medication_name}."
                ),
                ReminderItem(
                    time="00:00",
                    voice_reminder_text=f"Toma final del día de tu medicamento."
                )
            ]
        )
    )
