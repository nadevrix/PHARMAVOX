# Requerimientos del Sistema - PharmaVox Backend 📋⚙️

Este documento define las especificaciones funcionales y no funcionales del backend de PharmaVox, enfocado exclusivamente en asistir a farmacéuticos y profesionales de la salud en la consulta y gestión interactiva de prospectos de medicamentos oficiales.

---

## 🛠️ Requerimientos Funcionales (RF)

| ID | Nombre | Descripción | Asignado A | Tareas Asociadas |
| :--- | :--- | :--- | :--- | :--- |
| **RF-1** | **Indexación y Extracción Multimodal de PDFs** | El sistema debe recibir PDFs oficiales de prospectos técnicos de medicamentos, analizarlos mediante Gemini 1.5 Flash multimodal para extraer ~15 propiedades clínicas y persistirlos. | Sergio / Alejandro | **Tarea S-1**, **Tarea S-2**, **Tarea A-1** |
| **RF-2** | **RAG Estricto Farmacéutico** | El sistema debe responder preguntas conversacionales limitando su conocimiento exclusivamente al catálogo de PDFs técnicos cargados en la base de datos local. | Sergio / Alejandro | **Tarea S-2**, **Tarea A-3** |
| **RF-3** | **Respuestas Conversacionales de Voz Neural (TTS)** | Al realizar una consulta, el sistema debe generar dinámicamente un audio de respuesta MP3 codificado directamente en Base64 (`audio_base64`) en el mismo JSON para su reproducción manos libres instantánea. | Sergio / Alejandro | **Tarea S-2**, **Tarea A-3** |
| **RF-4** | **Estructura de Datos Visuales Híbridos** | El backend debe inyectar metadatos visuales (`visual_layout`) con tarjetas, semáforos de riesgo clínicos automáticos y viñetas en formato JSON para pantallas de computadores y tablets. | Alejandro | **Tarea A-4** |
| **RF-5** | **Base de Datos y Persistencia ORM** | El sistema debe persistir los metadatos clínicos y PDFs de forma permanente mediante SQLAlchemy para evitar la re-evaluación reiterada por IA. | Sergio | **Tarea S-1**, **Tarea S-3** |
| **RF-6** | **Panel CRUD de Usuarios (Administración)** | Permite al **Administrador (`admin`)** gestionar de forma total (CRUD con contraseñas encriptadas) las cuentas del personal farmacéutico en el sistema. | Sergio | **Tarea S-2**, **Tarea S-3** |
| **RF-7** | **CRUD de PDFs (Admin / Farmacéutico)** | Permite al **Administrador (`admin`)** realizar CRUD total sobre PDFs oficiales (Carga, modificación y eliminación física). Permite al **Farmacéutico (`pharmacist`)** VER (listar, descargar y consultar) los PDFs. | Sergio / Alejandro | **Tarea S-1**, **Tarea S-2**, **Tarea A-1** |
| **RF-8**| **Transmisión de Archivos PDF al Frontend** | El backend debe proveer un endpoint seguro para la transmisión de archivos binarios PDF, permitiendo al frontend renderizarlos en un visor interactivo. | Sergio | **Tarea S-2** |

---

## 👥 Matriz de Roles y Permisos de PharmaVox

Para garantizar el control de acceso y el correcto flujo de negocio en el backend, el sistema implementa exclusivamente los siguientes perfiles profesionales:

### 1. Administrador (`admin`)
*   **Propósito:** Gestión global del catálogo de medicamentos y del personal del establecimiento.
*   **Permisos de Usuario:** CRUD total (Crear, Leer, Actualizar, Borrar) sobre todas las cuentas del sistema (incluyendo farmacéuticos).
*   **Permisos de PDFs:** CRUD total (Carga física de archivos, listado, actualización de metadatos y eliminación de PDFs/medicamentos indexados).
*   **Permisos de Voz:** Acceso total al asistente conversacional RAG y TTS.

### 2. Farmacéutico / Bioquímico (`pharmacist`)
*   **Propósito:** Consulta e interacción manos libres con fichas técnicas y prospectos médicos oficiales durante la preparación o dispensación en mostrador/laboratorio.
*   **Permisos de Usuario:** Ninguno. No tiene acceso al panel de usuarios ni a APIs CRUD de cuentas.
*   **Permisos de PDFs:** Permiso de **Lectura únicamente** (`Read-Only`). Puede ver el listado de prospectos en PDF cargados, descargarlos y abrirlos en su computador.
*   **Permisos de Voz:** Puede utilizar el Asistente conversacional RAG por voz y texto sobre todo el catálogo farmacéutico indexado en la base de datos.

---

## ⚡ Requerimientos No Funcionales (RNF)

| ID | Nombre | Descripción | Asignado A | Tareas Asociadas |
| :--- | :--- | :--- | :--- | :--- |
| **RNF-1** | **Seguridad de Credenciales (Hashing PBKDF2)** | Las contraseñas de los usuarios deben encriptarse con un algoritmo de hashing seguro de una vía (`PBKDF2-SHA256`) con 100,000 iteraciones y sal aleatoria única. | Sergio | **Tarea S-3** |
| **RNF-2** | **Rendimiento y Latencia** | Las consultas conversacionales y de voz deben optimizarse mediante respuestas asíncronas para retornar el JSON + Base64 de audio en el menor tiempo posible. | Sergio / Alejandro | **Tarea S-2**, **Tarea S-5** |
| **RNF-3** | **Seguridad y Cifrado de Secretos** | Las credenciales críticas de la base de datos y la clave de la API de Gemini deben resguardarse en variables de entorno seguras fuera del código fuente. | Sergio | **Tarea S-4** |
| **RNF-4** | **Formateo Fonético Farmacéutico** | Las respuestas neurales optimizadas para voz (`voice_response`) deben omitir caracteres especiales, corchetes, viñetas o marcas markdown para evitar tropiezos de audio. | Alejandro | **Tarea A-3** |
