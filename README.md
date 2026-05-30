# PharmaVox Backend 🎙️💊
> **El cerebro de inteligencia artificial y voz que simplifica y humaniza el acceso a la información médica.**

PharmaVox Backend es un servicio web RESTful de alto rendimiento desarrollado en **Python** con **FastAPI**. Actúa como el núcleo de procesamiento inteligente de PharmaVox, integrando capacidades avanzadas de visión por computadora y modelos de lenguaje de última generación para procesar recetas, prospectos médicos y cajas de medicamentos, transformándolos en flujos interactivos de voz y texto simple estructurado.

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
*   **Entorno y Dependencias:** Python 3.10+ con gestión mediante entornos virtuales estándar.

---

## 📂 Documentación Detallada

Para facilitar la comprensión del diseño de la aplicación y sus características, consulta los siguientes documentos técnicos en la carpeta `docs/`:

*   📖 **[Arquitectura y Diseño del Sistema](docs/architecture.md):** Conoce el flujo de datos, el diseño de prompts para Gemini y el manejo de esquemas estructurados de IA.
*   📡 **[Especificación de Endpoints (API Spec)](docs/endpoints.md):** Detalles exactos sobre cómo consumir la API, formatos de payload de entrada/salida y códigos de estado.

---

## 🔧 Configuración Rápida del Entorno

### 1. Requisitos Previos
Asegúrate de tener instalado Python 3.10 o superior. Puedes verificarlo ejecutando:
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
