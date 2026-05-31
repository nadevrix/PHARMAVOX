# Guía de Integración Frontend y Uso de la API de PharmaVox 📡🔌

Esta guía proporciona toda la documentación técnica necesaria para integrar de manera profesional el backend de **PharmaVox** con cualquier aplicación frontend (React, Vue, Angular o Vanilla JavaScript).

---

## 🚦 1. Control de Acceso y Roles (Cabeceras de Simulación)

Para facilitar el desarrollo ágil sin sobrecargar con flujos complejos de OAuth2 o JWT en esta etapa del prototipo, el backend expone un esquema de autorización simulada mediante la cabecera HTTP **`X-Role`**.

### Configuración en el Cliente HTTP (Axios / Fetch)
Debes configurar tu cliente en el frontend para adjuntar la cabecera en cada petición según el usuario activo:

```javascript
// Ejemplo de configuración global con Axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
    // Cambiar dinámicamente según el usuario logueado ('admin' o 'pharmacist')
    'X-Role': 'pharmacist' 
  }
});
```

*   **`X-Role: admin`**: Permite realizar operaciones de escritura (crear/modificar/eliminar usuarios y prospectos PDFs).
*   **`X-Role: pharmacist`**: Permite listar prospectos, descargar archivos físicos, y usar el asistente conversacional.

Si se accede a un endpoint restringido sin la cabecera adecuada, el servidor retornará un código de estado `403 Forbidden`:
```json
{
  "detail": "Acceso denegado. Se requieren permisos de: ['admin']"
}
```

---

## 🗣️ 2. Integración con el Asistente Vox (POST `/api/v1/ask`)

El núcleo interactivo de la aplicación es el asistente conversacional. El endpoint responde con texto, instrucciones de renderizado visual y la **respuesta de voz neural en tiempo real codificada en Base64**.

*   **Ruta:** `POST /api/v1/ask`
*   **Payload de Petición (JSON):**
    ```json
    {
      "question": "¿Para qué sirve el paracetamol y qué dosis se recomienda?"
    }
    ```

*   **Respuesta del Servidor (200 OK):**
    ```json
    {
      "text_response": "El Paracetamol alivia el dolor leve o moderado y reduce la fiebre. La dosis recomendada es de 1 comprimido de 1g cada 6 a 8 horas, sin exceder los 3 gramos diarios.",
      "voice_response": "El Paracetamol alivia el dolor leve o moderado y reduce la fiebre. La dosis recomendada es de 1 comprimido de 1g cada 6 a 8 horas, sin exceder los 3 gramos diarios.",
      "visual_layout": {
        "display_mode": "card",
        "card_type": "info",
        "title": "Pauta de Dosificación",
        "content_bullets": [
          "Alivio de dolor leve o moderado y fiebre",
          "1 comprimido de 1g cada 6-8 horas",
          "No exceder el límite de 3 gramos al día"
        ],
        "highlight_color": "#0EA5E9"
      },
      "audio_chunks": [
        "/api/v1/assistant/audio"
      ],
      "audio_base64": "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjEwMC4xMDBh..."
    }
    ```

---

### 🔊 Cómo reproducir el Audio Neural Base64 en el Frontend al Instante

Para evitar hacer un segundo llamado de red al servidor para descargar el archivo de audio y reducir la latencia de respuesta a **cero**, la respuesta del backend incluye el audio MP3 en formato **Base64** en la propiedad `audio_base64`.

Puedes reproducir este audio inmediatamente en JavaScript usando la API nativa `Audio`:

```typescript
// Función de utilidad en React / TypeScript / JavaScript para reproducir audio Base64
export const playNeuralVoice = (base64Data: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!base64Data) {
        reject("No audio data provided");
        return;
      }
      
      // Construir el Data URL del archivo MP3
      const audioUrl = `data:audio/mp3;base64,${base64Data}`;
      const audio = new Audio(audioUrl);
      
      audio.onended = () => resolve();
      audio.onerror = (err) => reject(err);
      
      audio.play().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};
```

---

### 🎨 Cómo Renderizar el Layout Visual (`VisualLayout`) dinámicamente

El campo `visual_layout` instruye al frontend sobre cómo debe mostrar la tarjeta informativa al farmacéutico, ajustando colores y modos según la gravedad:

*   **`card_type: "warning"`** (Color destacado Rojo `#E11D48`): Para alertas críticas de seguridad, contraindicaciones severas o interacciones peligrosas.
*   **`card_type: "info"`** (Color destacado Celeste/Azul `#0EA5E9`): Para pautas de dosificación habituales, compuestos o conservación.

#### Componente React de Ejemplo:
```tsx
import React from 'react';

interface VisualLayout {
  display_mode: string;
  card_type: 'info' | 'warning';
  title: string;
  content_bullets: string[];
  highlight_color: string;
}

export const AssistantCard: React.FC<{ layout: VisualLayout }> = ({ layout }) => {
  return (
    <div 
      className="p-6 rounded-2xl border bg-white shadow-lg transition-all duration-300"
      style={{ borderLeft: `6px solid ${layout.highlight_color}` }}
    >
      <h3 className="text-lg font-bold text-slate-800 mb-3" style={{ color: layout.highlight_color }}>
        {layout.title}
      </h3>
      <ul className="space-y-2">
        {layout.content_bullets.map((bullet, idx) => (
          <li key={idx} className="flex items-start text-sm text-slate-600">
            <span className="mr-2 text-base" style={{ color: layout.highlight_color }}>•</span>
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

## 📄 3. Gestión y Carga de PDFs de Prospectos Técnicos

La API de PharmaVox permite a los administradores subir archivos PDF reales de prospectos médicos, los cuales son analizados de forma inteligente y persisten de forma única en el sistema.

### 3.1 Cargar y Analizar PDF (Multipart Form)
*   **Ruta:** `POST /api/v1/admin/pdfs` (Solo Admin)
*   **Content-Type:** `multipart/form-data`
*   **Código JS de Integración:**

```javascript
const uploadProspectusPDF = async (fileObject) => {
  const formData = new FormData();
  formData.append('file', fileObject); // fileObject viene de un input tipo file

  try {
    const response = await axios.post('http://127.0.0.1:8000/api/v1/admin/pdfs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Role': 'admin'
      }
    });
    console.log('PDF subido y procesado con éxito:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al subir PDF:', error.response?.data?.detail || error.message);
  }
};
```

*   **Respuesta del Servidor (201 Created):**
    *   *Nota:* Si el archivo ya existía previamente en base de datos o en disco, el servidor le concatena dinámicamente un timestamp único para evitar fallos de colisión de clave única (`UniqueViolation`), garantizando un 100% de éxito.
    ```json
    {
      "id": 12,
      "filename": "Paracetamol_Cinfa_1g.pdf",
      "file_path": "data/pdfs/Paracetamol_Cinfa_1g_1780201515.pdf",
      "file_size": 3904,
      "is_processed": true,
      "uploaded_at": "2026-05-31T04:25:17.248273",
      "download_url": "/api/v1/pdfs/12/download"
    }
    ```

---

### 3.2 Listar PDFs Registrados
*   **Ruta:** `GET /api/v1/pdfs` (Admin y Pharmacist)
*   **Respuesta del Servidor (200 OK):**
    *   Este listado contiene de forma nativa la propiedad `download_url`, lo que permite que el frontend renderice botones de descarga o visores incrustados con absoluta facilidad.
    ```json
    [
      {
        "id": 12,
        "filename": "Paracetamol_Cinfa_1g.pdf",
        "file_size": 3904,
        "is_processed": true,
        "uploaded_at": "2026-05-31T04:25:17.248273",
        "download_url": "/api/v1/pdfs/12/download"
      }
    ]
    ```

---

### 3.3 Visualización del PDF en el Navegador
Para incrustar y visualizar de forma interactiva el archivo PDF que reside físicamente en el servidor, solo debes apuntar un elemento `<iframe>` o visor de PDF a la URL absoluta del endpoint de descarga:

```tsx
import React from 'react';

export const PDFViewer: React.FC<{ pdfId: number }> = ({ pdfId }) => {
  const downloadUrl = `http://127.0.0.1:8000/api/v1/pdfs/${pdfId}/download`;
  
  return (
    <div className="w-full h-[600px] border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <iframe 
        src={downloadUrl} 
        className="w-full h-full" 
        title="Visualizador de Prospectos Técnicos"
      />
    </div>
  );
};
```

---

## 🛡️ 4. Robustez ante Fallos: Modo de Contingencia de Datos

El backend de PharmaVox está equipado con un **Sistema de Contingencia de Datos** automatizado en su motor. 

Si el servidor de inteligencia artificial externo (Gemini) excede sus límites de llamadas de cuota gratuita (`429 RESOURCE_EXHAUSTED`) o se queda temporalmente fuera de línea:
1.  El endpoint **sigue respondiendo de forma 100% exitosa (200 OK y 201 Created)**.
2.  El backend intercepta el fallo, entra en **Modo de Contingencia** e interpreta localmente los campos farmacológicos persistidos en la base de datos PostgreSQL.
3.  Formula una respuesta estructurada, firme e industrial libre de rodeos conversacionales que le permite al farmacéutico seguir operando de manera segura.

*   *Ejemplo de respuesta en modo contingencia:*
    > `"MODO DE CONTINGENCIA: Para Ibuprofeno 600mg (Ibuprofeno 600mg de Kern Pharma, S.L.), la pauta de dosificacion registrada es: Un comprimido de 600mg cada 8 horas (dosis máxima diaria 1800mg). Valide siempre contra la receta medica oficial antes de la dispensacion."`
