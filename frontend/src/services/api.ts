const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API_URL = `${API_BASE}/api/v1`;

// ============================================================
// Helper — Fetch con retry para cold starts de Railway
// ============================================================

async function fetchWithRetry(url: string, options?: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok && attempt < retries && response.status >= 500) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error('Failed after retries');
}

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
  audio_base64?: string;
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
  timezone?: string;
  created_at?: string;
}

export interface CreateUserRequest {
  email: string;
  full_name: string;
  role: 'pharmacist' | 'admin';
  timezone?: string;
  password: string;
}

export interface CreateUserResponse {
  id: number;
  email: string;
  full_name: string;
  role: 'pharmacist' | 'admin';
  timezone?: string;
  created_at?: string;
}

// ============================================================
// INTERFACES — Módulo 5: Admin - PDFs de Prospectos
// ============================================================

export interface PDFListItem {
  id: number;
  filename: string;
  file_path: string;
  file_size: number;
  is_processed: boolean;
  created_at: string;
}

// ============================================================
// FUNCIONES DE API — Todos los endpoints
// ============================================================

export const api = {
  // ── Healthcheck ──────────────────────────────────────────
  healthCheck: async (): Promise<HealthResponse> => {
    const response = await fetchWithRetry(`${API_BASE}/health`);
    if (!response.ok) throw new Error('Error al verificar estado del sistema');
    return response.json();
  },

  // ── Módulo 1: Escáner OCR ──────────────────────────────
  scanMedication: async (file: File): Promise<ScanResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchWithRetry(`${API_URL}/scan`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Error al escanear medicamento');
    return response.json();
  },

  // ── Módulo 2: Vox Assistant ────────────────────────────
  askAssistant: async (question: string, context: string, conversationHistory?: string[]): Promise<AskResponse> => {
    const response = await fetchWithRetry(`${API_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medication_context: context,
        question: question,
        conversation_history: conversationHistory || []
      })
    });

    if (!response.ok) throw new Error('Error en la consulta al asistente');
    return response.json();
  },

  // ── Módulo 3: Simplificador ────────────────────────────
  simplifyText: async (rawText: string): Promise<SimplifyResponse> => {
    const response = await fetchWithRetry(`${API_URL}/simplify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText })
    });

    if (!response.ok) throw new Error('Error al simplificar el texto');
    return response.json();
  },

  // ── Módulo 4: Planificador de Dosis ────────────────────
  scheduleDosage: async (medicationName: string, instructions: string): Promise<ScheduleResponse> => {
    const response = await fetchWithRetry(`${API_URL}/schedule`, {
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

  // ── Módulo 5.1: Admin - Usuarios ───────────────────────
  getUsers: async (role: string = 'admin'): Promise<UserResponse[]> => {
    const response = await fetchWithRetry(`${API_URL}/admin/users`, {
      headers: { 'X-Role': role }
    });
    if (!response.ok) throw new Error('Error al obtener la lista de usuarios');
    return response.json();
  },

  createUser: async (data: CreateUserRequest, role: string = 'admin'): Promise<CreateUserResponse> => {
    const response = await fetchWithRetry(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Role': role
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Error al crear el usuario');
    }
    return response.json();
  },

  updateUser: async (userId: number, data: Partial<CreateUserRequest>, role: string = 'admin'): Promise<UserResponse> => {
    const response = await fetchWithRetry(`${API_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Role': role
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Error al actualizar el usuario');
    }
    return response.json();
  },

  deleteUser: async (userId: number, role: string = 'admin'): Promise<void> => {
    const response = await fetchWithRetry(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'X-Role': role }
    });

    if (!response.ok) throw new Error('Error al eliminar el usuario');
  },

  // ── Módulo 5.2: Admin - PDFs ──────────────────────────
  uploadPDF: async (file: File, role: string = 'admin'): Promise<PDFListItem> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchWithRetry(`${API_URL}/admin/pdfs`, {
      method: 'POST',
      headers: { 'X-Role': role },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Error al subir el PDF');
    }
    return response.json();
  },

  updatePDFMetadata: async (pdfId: number, filename: string, role: string = 'admin'): Promise<PDFListItem> => {
    const response = await fetchWithRetry(`${API_URL}/admin/pdfs/${pdfId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Role': role
      },
      body: JSON.stringify({ filename })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Error al actualizar los metadatos del PDF');
    }
    return response.json();
  },

  deletePDF: async (pdfId: number, role: string = 'admin'): Promise<void> => {
    const response = await fetchWithRetry(`${API_URL}/admin/pdfs/${pdfId}`, {
      method: 'DELETE',
      headers: { 'X-Role': role }
    });

    if (!response.ok) throw new Error('Error al eliminar el PDF');
  },

  // ── Módulo 5.2: Catálogo de PDFs ──────────────────────
  listPDFs: async (role: string = 'pharmacist'): Promise<PDFListItem[]> => {
    const response = await fetchWithRetry(`${API_URL}/pdfs`, {
      headers: { 'X-Role': role }
    });
    if (!response.ok) throw new Error('Error al listar los PDFs');
    return response.json();
  },

  downloadPDF: async (pdfId: number, role: string = 'pharmacist'): Promise<void> => {
    window.open(`${API_URL}/pdfs/${pdfId}/download?x-role=${role}`, '_blank');
  },

  login: async (email: string, password: string): Promise<UserResponse> => {
    const response = await fetchWithRetry(`${API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Credenciales de acceso incorrectas.');
    }
    return response.json();
  },
};
