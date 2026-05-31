# Especificación de Endpoints - PharmaVox API 📡🔌

La API de PharmaVox proporciona una interfaz RESTful de alto rendimiento que expone servicios de procesamiento de medicamentos por IA, gestión de usuarios, carga de prospectos PDF, y respuestas conversacionales farmacéuticas por voz.

> [!NOTE]
> Todos los módulos con procesamiento inteligente utilizan **Gemini 1.5 Flash (alias estable `gemini-flash-latest`)** para máxima estabilidad, velocidad y eficiencia de costos.

---

## 🚦 1. Control de Acceso y Roles (RBAC Simulado)

Para facilitar la integración ágil con el frontend y pruebas en Postman, el backend implementa un control de acceso basado en roles mediante la cabecera HTTP **`X-Role`**.

### Roles Disponibles:
1. **`admin`**: Acceso total a todos los endpoints de administración (Usuarios, PDFs, Asistente).
2. **`pharmacist`**: Acceso de lectura y descarga de PDFs, y uso total del Asistente conversacional (acceso estándar).

Si un endpoint requiere permisos elevados y se accede con un rol no autorizado o sin cabecera, la API devolverá de forma automática:
*   **Código:** `403 Forbidden`
*   **Response Body:** `{"detail": "Acceso denegado. Se requieren permisos de: [roles_autorizados]"}`

---

## 🚦 2. Endpoint de Estado y Salud (Healthcheck)

### `GET /health`
Verifica el estado del backend, información básica del sistema y la conectividad con la API Key de Gemini.
*   **Cabeceras:** Ninguna (Acceso Público).
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "status": "healthy",
      "project": "PharmaVox Backend",
      "version": "1.0.0",
      "gemini_api_status": "configured"
    }
    ```

---

## 👤 3. Gestión CRUD de Usuarios (Solo Admin)
> [!IMPORTANT]
> **IMPLEMENTADO** — Protegido por rol `admin`. Almacena las contraseñas de forma segura en la base de datos usando el hashing PBKDF2-SHA256 con sal aleatoria. Las credenciales en texto plano o en hash **nunca** son expuestas en las respuestas JSON de salida (`UserOut`).

### 3.1 Listar Usuarios
`GET /api/v1/admin/users`
Devuelve la lista completa de todos los usuarios registrados.
*   **Cabeceras:** `X-Role: admin`
*   **Respuesta Exitosa (200 OK):**
    ```json
    [
      {
        "email": "juan.perez@vox.com",
        "full_name": "Juan Perez",
        "role": "pharmacist",
        "timezone": "America/Mexico_City",
        "id": 1,
        "created_at": "2026-05-31T03:30:00Z"
      }
    ]
    ```

### 3.2 Crear Usuario
`POST /api/v1/admin/users`
Crea una nueva cuenta de usuario y encripta su contraseña.
*   **Cabeceras:** `X-Role: admin`
*   **Cuerpo (JSON Request Body):**
    ```json
    {
      "email": "juan.perez@vox.com",
      "full_name": "Juan Perez",
      "role": "pharmacist",
      "timezone": "America/Mexico_City",
      "password": "supersecretpassword123"
    }
    ```
    *   *Restricciones:* El email debe ser único y válido. La contraseña (`password`) debe tener al menos **6 caracteres**.
*   **Respuesta Exitosa (201 Created):**
    ```json
    {
      "email": "juan.perez@vox.com",
      "full_name": "Juan Perez",
      "role": "pharmacist",
      "timezone": "America/Mexico_City",
      "id": 1,
      "created_at": "2026-05-31T03:30:00Z"
    }
    ```

### 3.3 Modificar Usuario
`PUT /api/v1/admin/users/{user_id}`
Actualiza parcialmente o en su totalidad los metadatos o contraseña de un usuario existente.
*   **Cabeceras:** `X-Role: admin`
*   **Cuerpo (JSON Request Body - Campos opcionales):**
    ```json
    {
      "full_name": "Juan Perez Modificado",
      "password": "newsecurepassword456"
    }
    ```
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "email": "juan.perez@vox.com",
      "full_name": "Juan Perez Modificado",
      "role": "pharmacist",
      "timezone": "America/Mexico_City",
      "id": 1,
      "created_at": "2026-05-31T03:30:00Z"
    }
    ```

### 3.4 Eliminar Usuario
`DELETE /api/v1/admin/users/{user_id}`
Elimina definitivamente un usuario de la base de datos.
*   **Cabeceras:** `X-Role: admin`
*   **Respuesta Exitosa (204 No Content):** (Sin cuerpo de respuesta).

---

## 📄 4. Gestión CRUD de PDFs de Prospectos Médicos
> [!IMPORTANT]
> **IMPLEMENTADO** — Carga archivos PDF oficiales, los analiza automáticamente de forma multimodal mediante Gemini 1.5 Flash para extraer ~15 propiedades farmacéuticas y los indexa en la base de datos local para el motor conversacional (RAG).

### 4.1 POST PDF (Cargar y Analizar por IA)
`POST /api/v1/admin/pdfs`
Carga un prospecto PDF en disco y lo analiza con Gemini en una sola operación.
*   **Cabeceras:** `X-Role: admin`
*   **Cuerpo (Multipart Form-Data):**
    *   `file`: Archivo binario con extensión `.pdf`.
*   **Respuesta Exitosa (201 Created):**
    ```json
    {
      "id": 1,
      "filename": "paracetamol_500.pdf",
      "file_path": "data/pdfs/paracetamol_500.pdf",
      "file_size": 240502,
      "is_processed": true,
      "created_at": "2026-05-31T03:31:10Z"
    }
    ```

### 4.2 Listar PDFs Registrados
`GET /api/v1/pdfs`
Devuelve el catálogo de todos los prospectos PDF que ya han sido procesados en el sistema.
*   **Cabeceras:** `X-Role: admin` o `X-Role: pharmacist`
*   **Respuesta Exitosa (200 OK):**
    ```json
    [
      {
        "id": 1,
        "filename": "paracetamol_500.pdf",
        "file_path": "data/pdfs/paracetamol_500.pdf",
        "file_size": 240502,
        "is_processed": true,
        "created_at": "2026-05-31T03:31:10Z"
      }
    ]
    ```

### 4.3 Modificar Metadatos de PDF
`PUT /api/v1/admin/pdfs/{pdf_id}`
Modifica datos administrativos de un PDF (por ejemplo, renombrar visualmente el archivo).
*   **Cabeceras:** `X-Role: admin`
*   **Cuerpo (JSON Request Body):**
    ```json
    {
      "filename": "Prospecto_Oficial_Paracetamol_500.pdf"
    }
    ```
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "id": 1,
      "filename": "Prospecto_Oficial_Paracetamol_500.pdf",
      "file_path": "data/pdfs/paracetamol_500.pdf",
      "file_size": 240502,
      "is_processed": true,
      "created_at": "2026-05-31T03:31:10Z"
    }
    ```

### 4.4 Descargar Archivo PDF
`GET /api/v1/pdfs/{pdf_id}/download`
Transmite en tiempo real el archivo binario PDF almacenado físicamente en el servidor. Excelente para renderizar en visualizadores de PDF interactivos de React/Vue.
*   **Cabeceras:** `X-Role: admin` o `X-Role: pharmacist`
*   **Respuesta Exitosa (200 OK):** Archivo binario transmitido por stream con cabecera `Content-Type: application/pdf`.

### 4.5 Eliminar PDF
`DELETE /api/v1/admin/pdfs/{pdf_id}`
Elimina físicamente el PDF del disco del servidor y remueve todos sus registros y datos médicos asociados de la base de datos de PharmaVox.
*   **Cabeceras:** `X-Role: admin`
*   **Respuesta Exitosa (204 No Content):** (Sin cuerpo de respuesta).

---

## 🗣️ 5. Vox Assistant (RAG & Audio Neural en Tiempo Real)
> [!IMPORTANT]
> **IMPLEMENTADO** — El núcleo del asistente farmacéutico inteligente de PharmaVox.
> *   **RAG Estricto**: Su conocimiento está limitado **estrictamente** a los PDFs cargados en la Base de Datos. Si no hay PDFs, o si se pregunta por un fármaco ausente, responde amablemente indicando que no cuenta con esa información.
> *   **Audio Directo en Base64**: La respuesta JSON incluye el audio MP3 generado con la voz neural de Microsoft `es-MX-DaliaNeural` codificado en una cadena de caracteres base64 (`audio_base64`), reduciendo la latencia de integración a cero para que el frontend reproduzca el audio de inmediato.

### 5.1 Preguntar al Asistente (Conversacional)
`POST /api/v1/ask`
*   **Cabeceras:** Ninguna (Acceso Público para cualquier Rol).
*   **Cuerpo (JSON Request Body):**
    ```json
    {
      "question": "¿Cuáles son las indicaciones del paracetamol?"
    }
    ```
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "text_response": "Tempra Forte de paracetamol alivia dolor y fiebre. Toma una tableta cada seis horas.",
      "voice_response": "Tempra Forte de paracetamol alivia dolor y fiebre. Toma una tableta cada seis horas.",
      "visual_layout": {
        "display_mode": "card",
        "card_type": "info",
        "title": "Información Farmacéutica",
        "content_bullets": [
          "Tempra Forte de paracetamol alivia dolor y fiebre",
          "Toma una tableta cada seis horas"
        ],
        "highlight_color": "#3B82F6"
      },
      "audio_chunks": [
        "/api/v1/assistant/audio"
      ],
      "audio_base64": "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjEwMC4xMDBh..."
    }
    ```

    #### Comportamiento del Layout Visual Automático:
    *   **Advertencias / Peligros:** Si la IA detecta palabras críticas (como "contraindicado", "reacción adversa", "no tomar", "peligro"), configura la respuesta a `card_type: "warning"` con color de destaque rojo (`#E11D48`).
    *   **Dosificaciones:** Si la pregunta es sobre cómo tomar o frecuencias de tomas, configura a `card_type: "info"` con color celeste de destaque (`#0EA5E9`).
    *   **General:** Respuestas normales se configuran a `card_type: "info"` con color azul (`#3B82F6`).

### 5.2 Obtener Archivo Físico MP3
`GET /api/v1/assistant/audio`
Permite descargar o reproducir directamente por stream el archivo físico MP3 con la última respuesta por voz generada.
*   **Cabeceras:** Ninguna (Acceso Público).
*   **Respuesta Exitosa (200 OK):** Archivo de audio MP3 con cabecera `Content-Type: audio/mpeg`.

