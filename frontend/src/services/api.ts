const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_URL = `${API_BASE}/api/v1`;

// ============================================================
// INTERFACES — Módulo 1: Escáner OCR
// ============================================================

export interface MedicationScanInfo {
  name: string;
  active_ingredient: string;
  concentration: string;
  presentation: string;
  manufacturer: string | null;
}

export interface ScanResponse {
  success: boolean;
  medication: MedicationScanInfo;
  quick_summary: string;
  critical_warnings: string[];
}

// ============================================================
// INTERFACES — Módulo 2: Vox Assistant
// ============================================================

export interface VisualLayout {
  display_mode: string;
  card_type: string;
  title: string;
  content_bullets: string[];
  highlight_color: string;
}

export interface AskResponse {
  text_response: string;
  voice_response: string;
  visual_layout: VisualLayout;
  audio_chunks: string[];
}

// ============================================================
// INTERFACES — Módulo 3: Simplificador de Prospectos
// ============================================================

export interface SimplifiedSection {
  title: string;
  description: string;
  icon: string;
}

export interface SimplifyResponse {
  simplified_title: string;
  sections: SimplifiedSection[];
}

// ============================================================
// INTERFACES — Módulo 4: Generador de Horarios
// ============================================================

export interface ReminderItem {
  time: string;
  voice_reminder_text: string;
}

export interface SchedulePlan {
  medication_name: string;
  duration_days: number;
  interval_hours: number;
  daily_tome_times: string[];
  reminders: ReminderItem[];
}

export interface ScheduleResponse {
  schedule_plan: SchedulePlan;
}

// ============================================================
// INTERFACES — Healthcheck
// ============================================================

export interface HealthResponse {
  status: string;
  project?: string;
  version?: string;
  gemini_api_status?: string;
  services?: {
    gemini_api: string;
  };
}

// ============================================================
// INTERFACES — Módulo 5: Admin - Usuarios
// ============================================================

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: 'pharmacist' | 'admin';
  is_active: boolean;
}

export interface CreateUserRequest {
  email: string;
  full_name: string;
  role: 'pharmacist' | 'admin';
  password: string;
}

export interface CreateUserResponse {
  success: boolean;
  user_id: number;
  message: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

// ============================================================
// INTERFACES — Módulo 5: Admin - PDFs de Prospectos
// ============================================================

export interface PDFListItem {
  id: number;
  medication_name: string;
  file_name: string;
  upload_date: string;
}

export interface PDFUploadResponse {
  success: boolean;
  pdf_id: number;
  file_path: string;
  message: string;
}

// ============================================================
// INTERFACES — Módulo 5: Asistente sobre PDFs
// ============================================================

export interface AskPDFSource {
  pdf_id: number;
  document_name: string;
  page_number: number;
  section_title: string;
  matched_text: string;
}

export interface AskPDFResponse {
  text_response: string;
  voice_response: string;
  visual_layout: VisualLayout;
  sources: AskPDFSource[];
}

// ============================================================
// FUNCIONES DE API — Todos los endpoints
// ============================================================

export const api = {
  // ── Healthcheck ──────────────────────────────────────────
  // GET /health
  healthCheck: async (): Promise<HealthResponse> => {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error('Error al verificar estado del sistema');
    return response.json();
  },

  // ── Módulo 1: Escáner OCR ──────────────────────────────
  // POST /api/v1/scan
  scanMedication: async (file: File): Promise<ScanResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/scan`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Error al escanear medicamento');
    return response.json();
  },

  // ── Módulo 2: Vox Assistant ────────────────────────────
  // POST /api/v1/ask
  askAssistant: async (question: string, context: string): Promise<AskResponse> => {
    const response = await fetch(`${API_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medication_context: context,
        question: question,
        conversation_history: []
      })
    });
    
    if (!response.ok) throw new Error('Error en la consulta al asistente');
    return response.json();
  },

  // ── Módulo 3: Simplificador ────────────────────────────
  // POST /api/v1/simplify
  simplifyText: async (rawText: string): Promise<SimplifyResponse> => {
    const response = await fetch(`${API_URL}/simplify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText })
    });
    
    if (!response.ok) throw new Error('Error al simplificar el texto');
    return response.json();
  },

  // ── Módulo 4: Planificador de Dosis ────────────────────
  // POST /api/v1/schedule
  scheduleDosage: async (medicationName: string, instructions: string): Promise<ScheduleResponse> => {
    const response = await fetch(`${API_URL}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medication_name: medicationName,
        instructions: instructions
      })
    });
    
    if (!response.ok) throw new Error('Error al generar la agenda de dosificación');
    return response.json();
  },

  // ── Módulo 5: Admin - CRUD Usuarios ────────────────────
  // GET /api/v1/admin/users
  getUsers: async (): Promise<UserResponse[]> => {
    const response = await fetch(`${API_URL}/admin/users`);
    if (!response.ok) throw new Error('Error al obtener la lista de usuarios');
    return response.json();
  },

  // POST /api/v1/admin/users
  createUser: async (data: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear el usuario');
    return response.json();
  },

  // DELETE /api/v1/admin/users/{user_id}
  deleteUser: async (userId: number): Promise<DeleteResponse> => {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar el usuario');
    return response.json();
  },

  // ── Módulo 5: Admin - CRUD PDFs ────────────────────────
  // POST /api/v1/admin/pdfs
  uploadPDF: async (file: File, medicationName: string): Promise<PDFUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('medication_name', medicationName);

    const response = await fetch(`${API_URL}/admin/pdfs`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Error al subir el archivo PDF');
    return response.json();
  },

  // DELETE /api/v1/admin/pdfs/{pdf_id}
  deletePDF: async (pdfId: number): Promise<DeleteResponse> => {
    const response = await fetch(`${API_URL}/admin/pdfs/${pdfId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar el archivo PDF');
    return response.json();
  },

  // ── Módulo 5: Lectura de PDFs (Admin + Pharmacist) ─────
  // GET /api/v1/pdfs
  listPDFs: async (): Promise<PDFListItem[]> => {
    const response = await fetch(`${API_URL}/pdfs`);
    if (!response.ok) throw new Error('Error al obtener el catálogo de PDFs');
    return response.json();
  },

  // GET /api/v1/pdfs/{pdf_id}/download
  downloadPDF: async (pdfId: number): Promise<string> => {
    const response = await fetch(`${API_URL}/pdfs/${pdfId}/download`);
    if (!response.ok) throw new Error('Error al descargar el PDF');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  // ── Módulo 5: Asistente de Voz sobre PDFs ─────────────
  // POST /api/v1/assistant/ask-pdf
  askAboutPDF: async (pdfId: number, question: string, conversationHistory: string[] = []): Promise<AskPDFResponse> => {
    const response = await fetch(`${API_URL}/assistant/ask-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdf_id: pdfId,
        question: question,
        conversation_history: conversationHistory
      })
    });
    if (!response.ok) throw new Error('Error al consultar sobre el PDF');
    return response.json();
  }
};
