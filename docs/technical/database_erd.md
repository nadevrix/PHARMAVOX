# Modelo Entidad-Relación de la Base de Datos - PharmaVox 🗄️📊

Este diagrama representa la estructura de datos que **Sergio** implementará en la **Tarea S-1** y la persistencia de tomas en la **Tarea S-2**, garantizando el almacenamiento optimizado y rápido de medicamentos y alarmas.

---

## 🗺️ Diagrama ERD (Entity-Relationship Diagram)

```mermaid
erDiagram
    USER ||--o{ SCAN_HISTORY : "realiza"
    USER ||--o{ DOSE_REMINDER : "tiene"
    MEDICATION ||--o{ SCAN_HISTORY : "registrado_en"
    MEDICATION ||--o{ DOSE_REMINDER : "asociado_a"

    USER {
        int id PK
        string email UNIQUE
        string full_name
        string timezone
        datetime created_at
    }

    MEDICATION {
        int id PK
        string name
        string active_ingredient
        string concentration
        string presentation
        string manufacturer
        string raw_leaflet_text
        string simplified_summary
        datetime cached_at
    }

    SCAN_HISTORY {
        int id PK
        int user_id FK
        int medication_id FK
        string image_url
        datetime scanned_at
        boolean ocr_success
    }

    DOSE_REMINDER {
        int id PK
        int user_id FK
        int medication_id FK
        string time_of_day
        string voice_reminder_text
        int interval_hours
        int duration_days
        boolean is_active
        datetime start_date
    }
```

---

## 📝 Descripción de las Entidades

1.  **USER (Usuario):** Representa a la persona física que interactúa con la aplicación (paciente o cuidador). Almacena su zona horaria para asegurar que los recordatorios de dosificación coincidan con su hora local exacta.
2.  **MEDICATION (Medicamento Cache):** Actúa como el catálogo e histórico de medicamentos procesados. Guarda la información estructurada devuelta por la IA de Gemini y el prospecto simplificado para evitar re-análisis costosos.
3.  **SCAN_HISTORY (Historial de Escaneo):** Almacena cada captura de cámara y carga de imágenes que se realiza en el sistema, permitiendo al usuario revisar su historial visual en el computador.
4.  **DOSE_REMINDER (Recordatorio de Dosis):** Contiene la lógica del planificador dinámico de tomas. Genera horarios precisos de tomas y almacena el texto hablado personalizado (`voice_reminder_text`) optimizado para alertas auditivas.
