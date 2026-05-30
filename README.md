# PharmaVox Backend 🎙️💻💊
> **El cerebro de Inteligencia Artificial multimodal y voz que hace comprensible y accesible la información médica para todos.**

PharmaVox es una plataforma interactiva que transforma los complejos prospectos médicos y recetas físicas en **experiencias auditivas y visuales fluidas**. Este repositorio contiene el **Backend en Python + FastAPI**, diseñado específicamente para actuar como el motor de procesamiento inteligente de PharmaVox.

---

## 📌 Contexto del Proyecto

### ⚠️ La Problemática
La lectura y correcta interpretación de los prospectos de los medicamentos y recetas médicas presenta desafíos críticos en la sociedad actual:
*   **Complejidad y Jerga Médica:** El lenguaje altamente clínico y la tipografía diminuta hacen que los prospectos sean casi indescifrables para el ciudadano común.
*   **Barreras de Accesibilidad:** Los adultos mayores, personas con discapacidad visual o con dificultades de lectura se encuentran en una situación de extrema vulnerabilidad al no poder acceder a la información de forma autónoma.
*   **Riesgos de Salud:** Un error al comprender las dosis recomendadas, los horarios o las advertencias de contraindicación puede desencadenar efectos adversos graves o reducir la efectividad del tratamiento.

### 💡 La Solución Propuesta
**PharmaVox** propone un asistente inteligente y multimodal de **Voz y Pantalla Visual** que elimina las barreras físicas y cognitivas de la automedicación e interpretación de recetas.
*   **¿Cómo soluciona este problema?** 
    1.  **Voz Interactiva:** Traduce las instrucciones médicas complejas a lenguaje natural conversacional, optimizando las respuestas para ser habladas fluidamente por lectores de pantalla y sistemas de audio (TTS).
    2.  **Layout Visual Enriquecido para Computadoras:** Al mismo tiempo que el usuario escucha las indicaciones, el backend le provee al cliente web una estructura visual interactiva (`visual_layout`) en formato JSON. Esta incluye tarjetas por bloques, cronogramas interactivos de dosificación, alertas con semáforos de riesgo y tipografías legibles de alto contraste ideales para pantallas de computadores y tablets.
*   **👥 ¿Para quién funciona esta solución?**
    *   **Adultos mayores** que requieren recordatorios claros y explicaciones pausadas.
    *   **Personas con discapacidad visual** que dependen de interacciones por voz 100% accesibles.
    *   **No nativos o personas con dificultades de lectura** que se benefician de explicaciones estructuradas en lenguaje simplificado.
    *   **Público en general** que desea llevar un control riguroso de su calendario de dosificación sin confusión.

---

## 🚀 Características Clave

*   **🔍 Multimodal OCR & AI (Scan Engine):** Procesamiento de imágenes de cajas y recetas médicas usando Gemini Multimodal para extraer ingredientes activos, marca, dosis recomendada y precauciones.
*   **🗣️ Vox Conversational Agent:** Orquestación de preguntas y respuestas médicas adaptadas en un lenguaje comprensible y amigable, listo para sintetizarse como voz.
*   **💻 Interfaz Dual (Voz + Pantalla Visual):** Además de la comunicación accesible por voz, el backend genera estructuras JSON de datos visuales enriquecidas, permitiendo al frontend renderizar tarjetas dinámicas, cronogramas de tomas y resúmenes de alta visibilidad optimizados para pantallas de computadores y tablets.
*   **📋 Simplificador de Prospectos:** Traducción automática de jerga técnica/clínica a explicaciones por bloques con formato limpio e interactivo.
*   **🕒 Generador Inteligente de Horarios:** Creación dinámica de un calendario y planificador de tomas a partir de las instrucciones de la receta o prospecto analizado.

---

## 🛠️ Stack Tecnológico

*   **Framework Principal:** [FastAPI](https://fastapi.tiangolo.com/) (Asíncrono, basado en tipos estándar de Python y validación estricta con Pydantic v2).
*   **Motor de Inteligencia Artificial:** [Google Generative AI SDK](https://github.com/google/generative-ai-python) (Modelos de la familia **Gemini 1.5/2.0 Flash/Pro**).
*   **Servidor ASGI:** [Uvicorn](https://www.uvicorn.org/) (Servidor asíncrono ultrarrápido).
*   **Base de Datos / Persistencia:** SQLite de desarrollo con ORM SQLModel / SQLAlchemy.

---

## 📂 Documentación Detallada del Proyecto

Para facilitar la comprensión del diseño de la aplicación y sus características, consulta los siguientes documentos en la carpeta `docs/`, ahora estructurada en subcarpetas para evitar sobrecarga:

*   📖 **[Arquitectura y Diseño del Sistema](docs/technical/architecture.md):** Conoce el flujo de datos, el diseño de prompts para Gemini y el manejo de esquemas estructurados de IA.
*   📊 **[Modelo Entidad-Relación de la BD](docs/technical/database_erd.md):** Estructura relacional de las tablas e historial de escaneos y alarmas.
*   📡 **[Especificación de Endpoints (API Spec)](docs/api/endpoints.md):** Detalles exactos sobre cómo consumir la API, formatos de payload de entrada/salida y códigos de estado.
*   📋 **[Requerimientos del Sistema](docs/planning/requirements.md):** Detalle de los requerimientos funcionales (RF) y no funcionales (RNF) del backend y su trazabilidad.
*   👥 **[Asignación de Tareas y Roles](docs/planning/team_tasks.md):** Distribución equitativa de las 10 tareas clave y sus dependencias del proyecto entre **Sergio** y **Alejandro**.

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
