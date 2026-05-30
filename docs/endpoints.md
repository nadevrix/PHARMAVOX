# Especificación de Endpoints - PharmaVox API 📡🔌

La API de PharmaVox proporciona una interfaz RESTful de alto rendimiento que expone los servicios de procesamiento de medicamentos por IA. Por defecto, todas las respuestas exitosas devuelven un código de estado `200 OK` y formato `application/json`.

---

## 🚦 Endpoint de Estado y Salud (Healthcheck)

### `GET /health`
Verifica el estado del backend y la conectividad con los servicios críticos (como la API de Gemini).

*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "status": "healthy",
      "version": "1.0.0",
      "services": {
        "gemini_api": "connected"
      }
    }
    ```

---

## 🔍 Módulo 1: Escáner y OCR de Medicamentos

### `POST /api/v1/scan`
Recibe una imagen (caja de medicamento, frasco o receta) y devuelve un análisis estructurado del contenido.

*   **Request (Multipart Form-Data):**
    *   `file`: Archivo de imagen (JPEG, PNG o WEBP).
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "medication": {
        "name": "Ibuprofeno 600mg",
        "active_ingredient": "Ibuprofeno",
        "concentration": "600 mg",
        "presentation": "Comprimidos (Caja de 20 unidades)",
        "manufacturer": "Laboratorio Generics S.A."
      },
      "quick_summary": "Medicamento antiinflamatorio indicado para el alivio del dolor y la fiebre.",
      "critical_warnings": [
        "No tomar en caso de úlcera gástrica activa.",
        "Evitar el consumo excesivo de alcohol durante el tratamiento."
      ]
    }
    ```

---

## 🗣️ Módulo 2: Vox Assistant (Chat por Voz Interactivo)

### `POST /api/v1/ask`
Permite al usuario realizar preguntas conversacionales sobre un medicamento analizado previamente. Ideal para interactuar por voz.

*   **Request JSON Payload:**
    ```json
    {
      "medication_context": "Ibuprofeno 600mg",
      "question": "¿Lo puedo tomar con el estómago vacío?",
      "conversation_history": []
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "text_response": "Se recomienda encarecipadamente tomar el ibuprofeno con comida o después de comer para evitar la irritación del estómago.",
      "voice_response": "Es mejor que tomes el ibuprofeno acompañado de comida o con un vaso de leche. Así protegerás tu estómago.",
      "visual_layout": {
        "display_mode": "card",
        "card_type": "warning",
        "title": "Instrucción de Consumo",
        "content_bullets": [
          "Tomar con alimentos o leche.",
          "Evita la irritación del estómago."
        ],
        "highlight_color": "#E11D48"
      },
      "audio_chunks": []
    }
    ```

---

## 📋 Módulo 3: Simplificador de Prospectos

### `POST /api/v1/simplify`
Simplifica las complejas instrucciones de un prospecto de medicamento, dividiéndolas en tarjetas de fácil lectura adaptadas a pacientes vulnerables.

*   **Request JSON Payload:**
    ```json
    {
      "raw_text": "[Texto largo copiado del prospecto u obtenido por OCR...]"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "simplified_title": "Guía Fácil de Ibuprofeno 600mg",
      "sections": [
        {
          "title": "¿Para qué sirve?",
          "description": "Sirve para calmar dolores comunes de cabeza, dientes, y reducir la fiebre o inflamación.",
          "icon": "pain_relief"
        },
        {
          "title": "¿Cómo tomarlo?",
          "description": "Toma 1 pastilla cada 8 horas, preferiblemente con alimentos. No tomes más de 3 al día.",
          "icon": "dosage"
        },
        {
          "title": "¡Cuidado con esto!",
          "description": "Si tienes problemas de estómago frecuentes o estás embarazada, no debes tomarlo sin consultar a tu médico.",
          "icon": "warning"
        }
      ]
    }
    ```

---

## 🕒 Módulo 4: Generador de Horarios y Dosificación

### `POST /api/v1/schedule`
Crea un calendario de tomas estructurado a partir del prospecto o la indicación de la receta médica.

*   **Request JSON Payload:**
    ```json
    {
      "medication_name": "Ibuprofeno 600mg",
      "instructions": "Tomar una cápsula cada 8 horas por 5 días empezando mañana a las 8 AM"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "schedule_plan": {
        "medication_name": "Ibuprofeno 600mg",
        "duration_days": 5,
        "interval_hours": 8,
        "daily_tome_times": [
          "08:00",
          "16:00",
          "00:00"
        ],
        "reminders": [
          {
            "time": "08:00",
            "voice_reminder_text": "Es hora de tu toma de Ibuprofeno seiscientos miligramos."
          },
          {
            "time": "16:00",
            "voice_reminder_text": "Recuerda tomar tu dosis de Ibuprofeno seiscientos miligramos."
          },
          {
            "time": "00:00",
            "voice_reminder_text": "Toma final del día de tu medicamento."
          }
        ]
      }
    }
    ```
