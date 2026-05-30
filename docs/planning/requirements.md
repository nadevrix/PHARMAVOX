# Requerimientos del Sistema - PharmaVox Backend 📋⚙️

Este documento define las especificaciones funcionales y no funcionales del backend de PharmaVox. Cada requerimiento está directamente asignado a las tareas del equipo para asegurar una trazabilidad completa del proyecto.

---

## 🛠️ Requerimientos Funcionales (RF)

| ID | Nombre | Descripción | Asignado A | Tareas Asociadas |
| :--- | :--- | :--- | :--- | :--- |
| **RF-1** | **Escaneo y Extracción Multimodal** | El sistema debe recibir imágenes de cajas de medicamentos y recetas para extraer nombre, ingrediente activo, presentación y advertencias mediante IA multimodal. | Alejandro | **Tarea A-1**, **Tarea A-5** |
| **RF-2** | **Conversión y Simplificación por IA** | El sistema debe traducir textos médicos y prospectos complejos a bloques de lenguaje sencillo y digerible para pacientes. | Alejandro | **Tarea A-2**, **Tarea A-5** |
| **RF-3** | **Respuestas Conversacionales de Voz** | El sistema debe procesar consultas directas del usuario por chat y retornar textos redactados fonéticamente y listos para ser reproducidos de forma fluida por un motor de voz (TTS). | Alejandro | **Tarea A-3** |
| **RF-4** | **Estructura de Datos Visuales Híbridos** | El backend debe inyectar metadatos visuales (`visual_layout`) con íconos, alertas semánticas y viñetas en formato JSON para que el frontend los despliegue en pantallas de computadoras. | Alejandro | **Tarea A-4** |
| **RF-5** | **Base de Datos de Medicamentos y Caché** | El sistema debe guardar un registro estructurado de los medicamentos ya escaneados para agilizar consultas repetidas y evitar sobrecostos por APIs externas. | Sergio | **Tarea S-1**, **Tarea S-3** |
| **RF-6** | **Programador Dinámico de Tomas** | El sistema debe generar calendarios de dosificación dinámicos a partir de recetas e instrucciones, guardándolos persistentemente para alarmas futuras. | Sergio | **Tarea S-2** |
| **RF-7** | **Panel CRUD de Usuarios (Administración)** | El sistema debe permitir a los usuarios con rol de administrador crear, leer, actualizar y eliminar (CRUD) cuentas de usuarios del sistema de forma segura. | Sergio | **Tarea S-2** |
| **RF-8** | **CRUD y Carga de PDFs (Administración)** | El sistema debe permitir a administradores cargar y gestionar archivos PDF de prospectos médicos oficiales, integrándose con el analizador de Gemini. | Sergio / Alejandro | **Tarea S-1**, **Tarea A-1** |
| **RF-9** | **Reconocimiento de Voz Conversacional (STT)** | El sistema debe permitir al usuario interactuar mediante voz, procesando audio transcripto en el cliente o subiendo audios para que Gemini los analice. | Alejandro | **Tarea A-3** |


---

## ⚡ Requerimientos No Funcionales (RNF)

| ID | Nombre | Descripción | Asignado A | Tareas Asociadas |
| :--- | :--- | :--- | :--- | :--- |
| **RNF-1** | **Rendimiento y Latencia Optimizada** | El sistema debe responder las consultas no multimodales en un tiempo menor a 1.5 segundos mediante caché y optimizaciones de infraestructura. | Sergio | **Tarea S-3**, **Tarea S-5** |
| **RNF-2** | **Escalabilidad y Concurrencia** | El backend de FastAPI debe implementarse asíncronamente (`async`/`await`), tolerando solicitudes simultáneas concurrentes sin bloqueos. | Sergio | **Tarea S-4** |
| **RNF-3** | **Seguridad y Cifrado de Secretos** | Las credenciales críticas del sistema y la llave de la API de Gemini deben resguardarse en variables de entorno seguras fuera del código fuente. | Sergio | **Tarea S-4** |
| **RNF-4** | **Formateo Fonético Accesible** | Las respuestas optimizadas para voz (`voice_response`) deben omitir caracteres especiales, corchetes, viñetas o enlaces web para evitar tropiezos de audio en el motor de voz. | Alejandro | **Tarea A-3** |
