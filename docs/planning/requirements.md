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
| **RF-7** | **Panel CRUD de Usuarios (Administración)** | Permite al **Administrador (`admin`)** gestionar de forma total (CRUD: crear, leer, actualizar, suspender/eliminar) todas las cuentas de usuario en el sistema. El **Farmacéutico (`pharmacist`)** no tiene acceso a este panel. | Sergio | **Tarea S-2** |
| **RF-8** | **Gestión y Carga de PDFs (Admin / Farmacéutico)** | Permite al **Administrador (`admin`)** realizar CRUD total sobre PDFs oficiales de prospectos. Permite al **Farmacéutico (`pharmacist`)** únicamente VER (listar y leer) los PDFs cargados. Ambos pueden realizar preguntas de voz sobre el contenido de dichos PDFs. | Sergio / Alejandro | **Tarea S-1**, **Tarea S-2**, **Tarea A-1** |
| **RF-9** | **Reconocimiento de Voz Conversacional (STT)** | El sistema debe permitir al usuario interactuar mediante voz, procesando audio transcrito en el cliente o subiendo audios para que Gemini los analice. | Alejandro | **Tarea A-3** |
| **RF-10**| **Transmisión de Archivos PDF al Frontend** | El backend debe proveer un endpoint seguro para la transmisión de archivos binarios PDF, permitiendo al frontend renderizarlos en un visor interactivo al hacer clic en ellos. | Sergio | **Tarea S-2** |
| **RF-11**| **Trazabilidad y Fuentes de la IA** | Al consultar un PDF, la respuesta de la IA debe incluir un bloque de fuentes (`sources`) indicando el nombre del archivo, número de página y sección referenciada. | Alejandro | **Tarea A-1**, **Tarea A-2** |

---

## 👥 Matriz de Roles y Permisos de PharmaVox

Para garantizar el control de acceso y el correcto flujo de negocio en el backend, el sistema implementa los siguientes perfiles de usuario diferenciados:

### 1. Administrador (`admin`)
*   **Propósito:** Gestión global del sistema de salud y de la plataforma.
*   **Permisos de Usuario:** CRUD total (Crear, Leer, Actualizar, Borrar) sobre todas las cuentas del sistema (incluyendo farmacéuticos y otros administradores).
*   **Permisos de PDFs:** CRUD total (Carga de archivos, listado, actualización de metadatos y eliminación de PDFs).
*   **Permisos de Voz:** Puede activar el modo voz en su respectiva aplicación de administración para interrogar interactivamente a la IA de Gemini sobre cualquiera de los PDFs cargados.

### 2. Farmacéutico (`pharmacist`)
*   **Propósito:** Consulta e interacción con material médico oficial para la atención de pacientes.
*   **Permisos de Usuario:** Ninguno. No tiene acceso al panel de usuarios ni a APIs CRUD de cuentas.
*   **Permisos de PDFs:** Permiso de **Lectura únicamente** (`Read-Only`). Puede ver el listado de prospectos en PDF cargados, abrirlos y consultarlos.
*   **Permisos de Voz:** Puede activar el modo voz en su respectiva aplicación farmacéutica para preguntar de forma interactiva a la IA sobre la información contenida en los PDFs médicos del sistema.

### 3. Pacientes (`patient`) y Cuidadores (`caregiver`)
*   **Propósito:** Destinatarios del asistente de accesibilidad PharmaVox para tomas, escaneo rápido y alarmas diarias.
*   **Permisos:** Uso de la API pública para escaneo de recetas/cajas, simplificación interactiva de prospectos, generación y persistencia de su propio calendario de tomas y alarmas por voz personalizadas.

---

## ⚡ Requerimientos No Funcionales (RNF)

| ID | Nombre | Descripción | Asignado A | Tareas Asociadas |
| :--- | :--- | :--- | :--- | :--- |
| **RNF-1** | **Rendimiento y Latencia Optimizada** | El sistema debe responder las consultas no multimodales en un tiempo menor a 1.5 segundos mediante caché y optimizaciones de infraestructura. | Sergio | **Tarea S-3**, **Tarea S-5** |
| **RNF-2** | **Escalabilidad y Concurrencia** | El backend de FastAPI debe implementarse asíncronamente (`async`/`await`), tolerando solicitudes simultáneas concurrentes sin bloqueos. | Sergio | **Tarea S-4** |
| **RNF-3** | **Seguridad y Cifrado de Secretos** | Las credenciales críticas del sistema y la llave de la API de Gemini deben resguardarse en variables de entorno seguras fuera del código fuente. | Sergio | **Tarea S-4** |
| **RNF-4** | **Formateo Fonético Accesible** | Las respuestas optimizadas para voz (`voice_response`) deben omitir caracteres especiales, corchetes, viñetas o enlaces web para evitar tropiezos de audio en el motor de voz. | Alejandro | **Tarea A-3** |
