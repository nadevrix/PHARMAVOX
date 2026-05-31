# PharmaVox Backend 🎙️💻💊
> **El cerebro de Inteligencia Artificial y voz neural diseñado para asistir a farmacéuticos y profesionales de la salud en la consulta y gestión rápida de información técnica de medicamentos.**

PharmaVox es una plataforma interactiva que transforma los complejos prospectos médicos oficiales en **experiencias auditivas y visuales fluidas**. Este repositorio contiene el **Backend en Python + FastAPI**, diseñado específicamente para actuar como el motor de procesamiento inteligente RAG (Retrieval-Augmented Generation) y TTS (Text-to-Speech) de PharmaVox.

---

## 📌 Contexto del Proyecto

### ⚠️ La Problemática
La consulta rápida y correcta interpretación de los prospectos técnicos de medicamentos presenta desafíos críticos para los farmacéuticos en su labor diaria:
*   **Complejidad y Densidad de Información:** Los prospectos médicos contienen lenguaje altamente clínico, tipografía diminuta y densidades densas de texto que ralentizan la consulta rápida en el mostrador o laboratorio.
*   **Falta de Herramientas de Consulta Interactiva y Manos Libres:** Durante la dispensación o preparación, los profesionales farmacéuticos tienen las manos ocupadas y necesitan acceder a respuestas clínicas (dosis, contraindicaciones, interacciones) de forma auditiva y concisa.
*   **Riesgos en la Dispensación:** Errores al identificar interacciones medicamentosas o contraindicaciones críticas de prospectos extensos pueden poner en peligro la salud de los clientes y la responsabilidad del profesional.

### 💡 La Solución Propuesta
**PharmaVox** propone un asistente inteligente y multimodal de **Voz y Pantalla Visual** que asiste a los bioquímicos, farmacéuticos y personal técnico:
*   **¿Cómo soluciona este problema?** 
    1.  **Voz Interactiva Farmacéutica:** Traduce las consultas clínicas a respuestas naturales cortas habladas fluidamente por el motor de voz neural en tiempo real (TTS), ideal para consultas manos libres en el laboratorio o farmacia.
    2.  **Layout Visual Enriquecido para Computadoras:** Al mismo tiempo que el farmacéutico escucha las indicaciones, el backend provee al cliente web una estructura visual interactiva (`visual_layout`) en formato JSON. Esta incluye tarjetas por bloques, alertas con semáforos de riesgo clínicos y tipografías legibles de alto contraste.
    3.  **Procesamiento y Gestión de PDFs:** Permite al administrador de la farmacia cargar archivos PDF completos de prospectos médicos oficiales para que la IA los lea, indexe y estructure de forma nativa en segundos, creando una base de conocimiento RAG local y segura.
*   **👥 ¿Para quién funciona esta solución?**
    *   **Farmacéuticos y Bioquímicos** que requieren consultar interacciones críticas o posologías de forma inmediata.
    *   **Personal de Farmacia y Auxiliares** que asisten en mostrador y necesitan guías rápidas legibles y estructuradas.
    *   **Administradores de Farmacia** que gestionan la carga del catálogo oficial de prospectos autorizados en el sistema.

---

## 🚀 Características Clave

*   **🔍 RAG Multimodal PDF Engine:** Lectura y extracción inteligente de **documentos PDF completos de prospectos médicos oficiales** mediante Gemini 1.5 Flash, persistiendo sus campos clínicos y técnicos en la Base de Datos.
*   **🗣️ Vox Assistant (Alexa-Style):** Orquestador de respuestas cortas adaptadas al entorno farmacéutico profesional en un lenguaje directo, seguro y libre de jerga redundante.
*   **🎙️ TTS Neural en Base64 Integrado:** Generación de voz neural en el backend devuelta directamente en formato Base64 en la misma llamada del Asistente, permitiendo reproducción inmediata en mostrador o laboratorio.
*   **💻 Interfaz Dual (Voz + Pantalla Visual):** Estructuras JSON enriquecidas para el frontend, con semáforos automáticos de riesgo de seguridad para interacciones clínicas.

---

## 🛠️ Stack Tecnológico

*   **Framework Principal:** [FastAPI](https://fastapi.tiangolo.com/) (Asíncrono, de alto rendimiento, basado en tipado estricto con Pydantic v2).
*   **Motor de Inteligencia Artificial:** [Google GenAI SDK (`google-genai`)](https://github.com/googleapis/python-genai) — SDK unificado de Google para **Gemini 2.5 Flash** con soporte multimodal nativo (PDFs, imágenes, voz).
*   **Base de Datos Relacional (SQL):** **PostgreSQL** para contenedores y producción. Utiliza SQLite local en desarrollo como una alternativa ágil y sin dependencias adicionales de sistema.
*   **Mapeador Objeto-Relacional (ORM):** **SQLAlchemy 2.0** (implementación moderna con tipados robustos `Mapped` y `mapped_column` para máxima seguridad y autocompletado en el IDE).
*   **Contenedores e Infraestructura:** **Docker** y **Docker Compose** para orquestar y aislar los servicios de base de datos Postgres y el servidor web FastAPI con configuraciones de red y persistencia automatizadas.
*   **Servidor ASGI:** [Uvicorn](https://www.uvicorn.org/) (Servidor asíncrono ultrarrápido).

---

## 🎙️ Asistente de Voz Standalone (Alejandro)

El script `scripts/farmavox_voice_poc.py` es una **prueba de concepto (PoC)** de voz desarrollada por **Alejandro**.
Valida el flujo completo STT → Gemini → TTS de forma standalone, **no forma parte del servidor**.
Reutiliza `app/services/` en lugar de duplicar lógica.

> **Para ejecutar el PoC:** `python scripts/farmavox_voice_poc.py` (requiere `SpeechRecognition`, `pyaudio`, `edge-tts`, `pygame`)
>
> **Audio de prueba:** `data/tests_audio/input.wav` — grabación WAV que Alejandro usó para validar el flujo.

### Lo que Alejandro implementó

| Módulo | Función | Estado |
|--------|---------|--------|
| `MemoriaSesion` | Historial de sesión en RAM (chat + PDFs + medicamentos) | ✅ Completado |
| `responder_pregunta()` | Chat con Gemini 2.5 Flash con historial completo | ✅ Completado |
| `analizar_pdf()` | Análisis multimodal de PDFs con prompt estructurado | ✅ Completado |
| `reproducir_audio()` | TTS con Edge TTS (voz neural `es-MX-DaliaNeural`) | ✅ Completado |
| `escuchar()` | STT con SpeechRecognition + Google | ✅ Completado |
| `SYSTEM_PROMPT` | Personalidad de FarmaVox farmacéutico colega | ✅ Completado |
| `PROMPT_ANALISIS_PDF` | Extracción de ~15 campos farmacéuticos del PDF | ✅ Completado |

### Integración al Backend

La lógica de Alejandro fue extraída a servicios reutilizables del backend:

```
scripts/farmavox_voice_poc.py  (⚠️ PoC de voz — NO parte del servidor)
  └── importa app/services/gemini_service  →  misma lógica que POST /api/v1/ask
  └── importa app/services/pdf_service     →  misma lógica que POST /api/v1/scan

Origen de la lógica (Alejandro → codebase):
  responder_pregunta()  →  gemini_service.ask_assistant()
  analizar_pdf()        →  pdf_service.analyze_pdf()
  PROMPT_ANALISIS_PDF   →  pdf_service.PROMPT_ANALISIS_PDF
  SYSTEM_PROMPT         →  gemini_service.SYSTEM_PROMPT

Carpetas de trabajo del PoC:
  data/pdfs_pendientes/     — PDFs a analizar
  data/resultados_analisis/ — JSONs extraídos
  data/tests_audio/         — input.wav (audio de prueba de Alejandro)
```

---

## 📂 Arquitectura de Servicios y Archivos

```
app/
├── api/
│   └── endpoints/
│       ├── assistant.py    # ✅ Vox Assistant (RAG estricto sobre BD + TTS neural en base64)
│       ├── admin_users.py  # ✅ CRUD de usuarios seguro con contraseñas encriptadas (admin)
│       └── admin_pdfs.py   # ✅ CRUD de prospectos PDF físicos con almacenamiento local (admin)
├── services/
│   ├── gemini_service.py   # ✅ Integración con Gemini 1.5 Flash estable para consultas conversacionales
│   └── pdf_service.py      # ✅ Procesamiento y análisis de prospectos médicos en PDF
├── schemas/
│   ├── assistant.py        # ✅ Estructuras JSON del asistente (layouts, respuestas visuales y TTS)
│   └── user.py             # ✅ Esquemas de usuario para CRUD con seguridad de contraseñas
├── models/
│   ├── user.py             # ✅ Modelo de Usuario SQLAlchemy (con hashed_password)
│   ├── leaflet_pdf.py      # ✅ Modelo de PDFs persistidos e información JSON indexada
│   └── medication.py       # ✅ Modelo RAG para indexado local y conocimiento del asistente
├── core/
│   ├── config.py           # ✅ Carga centralizada de variables de entorno (.env)
│   └── security.py         # ✅ Hashing nativo y verificación de contraseñas mediante PBKDF2
└── tests/
    ├── test_services.py          # ✅ Pruebas unitarias de servicios de IA con mocks
    └── test_integration_flow.py  # ✅ Suite de integración de extremo a extremo de todo el sistema
```

---

## 📂 Documentación Detallada del Proyecto

Para facilitar la comprensión del diseño de la aplicación y sus características, consulta los siguientes documentos en la carpeta `docs/`, ahora estructurada en subcarpetas para evitar sobrecarga:

*   📖 **[Arquitectura y Diseño del Sistema](docs/technical/architecture.md):** Conoce el flujo de datos, el diseño de prompts para Gemini y el manejo de esquemas estructurados de IA.
*   📊 **[Modelo Entidad-Relación de la BD](docs/technical/database_erd.md):** Estructura relacional de las tablas e historial de escaneos y alarmas.
*   📡 **[Especificación de Endpoints (API Spec)](docs/api/endpoints.md):** Detalles exactos sobre cómo consumir la API, formatos de payload de entrada/salida y códigos de estado.
*   📋 **[Requerimientos del Sistema](docs/planning/requirements.md):** Detalle de los requerimientos funcionales (RF) y no funcionales (RNF) del backend y su trazabilidad.
*   👥 **[Asignación de Tareas y Roles](docs/planning/team_tasks.md):** Distribución equitativa de las 10 tareas clave y sus dependencias del proyecto entre **Sergio** y **Alejandro**.
*   🛠️ **[Lineamientos de Desarrollo y Buenas Prácticas (Qué NO hacer)](docs/technical/development_guidelines.md):** Manual técnico esencial sobre estándares de desarrollo, manejo estricto de variables de entorno y antipatrones de programación que se deben evitar en PharmaVox.

---

## 🛑 Lineamientos de Desarrollo (Qué NO hacer en el Código)

Para garantizar la mantenibilidad y un desarrollo ágil y profesional, todo el equipo debe seguir estrictamente estas directrices técnicas. Consulta el manual completo y detallado en **[Lineamientos de Desarrollo y Buenas Prácticas](docs/technical/development_guidelines.md)**.

A modo de resumen rápido, **se debe evitar rotundamente**:

1. **NO hardcodear ni duplicar variables de configuración en Python:** Las constantes, strings de conexión o credenciales de la API de Gemini nunca deben definirse con valores fijos dentro de clases o archivos en Python. Todo debe provenir de `.env` y ser mapeado de forma exclusiva en `app/core/config.py`.
2. **NO forzar configuraciones rígidas de SQLite:** La base de datos oficial de producción de PharmaVox es **PostgreSQL**. El uso de SQLite está restringido únicamente a un fallback dinámico controlado de desarrollo local si el `.env` así lo define.
3. **NO crear endpoints, modelos o rutas "huérfanas":** Todo archivo nuevo o modificado debe documentarse y explicarse en el archivo de [Asignación de Tareas (team_tasks.md)](docs/planning/team_tasks.md) detallando su carpeta, nombre y función exacta para mantener a todo el equipo al tanto de las modificaciones.
4. **NO usar llamadas síncronas bloqueantes en el event loop:** Toda lógica de E/S pesada debe ser asíncrona (`async/await`) o declarada adecuadamente para no degradar el desempeño y asegurar la concurrencia rápida del sistema.
5. **NO ignorar el punto de entrada ORM:** Todos los nuevos modelos SQLAlchemy se deben registrar en `app/models/__init__.py` para asegurar su autogeneración en el arranque de la aplicación.

---

## 🔧 Configuración Rápida del Entorno

### 1. Requisitos Previos
Asegúrate de tener instalado Python 3.11 o superior. Puedes verificarlo ejecutando:
```bash
python --version
```

### 2. Clonación y Creación del Entorno Virtual
Crea un entorno virtual para aislar las dependencias del proyecto:
```bash
# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual (Windows - PowerShell)
.\.venv\Scripts\Activate.ps1

# Activar entorno virtual (Linux/macOS)
source .venv/bin/activate
```

### 3. Instalación de Dependencias
Instala los paquetes necesarios listados en `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 4. Variables de Entorno
Copia el archivo de ejemplo `.env.example` a un nuevo archivo `.env` y rellena las credenciales correspondientes:
```bash
cp .env.example .env
```
Asegúrate de configurar tu `GEMINI_API_KEY` dentro de dicho archivo.

### 5. Iniciar Servidor de Desarrollo
Levanta la API localmente utilizando Uvicorn en modo de recarga automática:
```bash
uvicorn app.main:app --reload
```
Una vez iniciado, podrás interactuar con la API y probar sus endpoints visualmente en:
*   Interactive Swagger UI: `http://127.0.0.1:8000/docs`
*   ReDoc alternative view: `http://127.0.0.1:8000/redoc`

### 6. Ejecutar la Suite de Pruebas (Tests)
Para ejecutar todas las pruebas automatizadas del sistema (incluyendo los tests unitarios de servicios y la nueva suite de integración de extremo a extremo con base de datos SQLite en memoria):
```bash
# Ejecutar todas las pruebas con detalles de salida
pytest -v
```
