import { useState, useEffect } from 'react';
import { LogOut, Mic, Search, FileText, BrainCircuit, Users, Plus, ShieldCheck, Scan, LayoutList, Clock, Trash2, UploadCloud, Loader2, AlertTriangle, CheckCircle2, X, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VoiceAssistantPanel } from '../../components/ui/VoiceAssistantPanel';
import { ScannerPanel } from '../../components/ui/ScannerPanel';
import { SimplifierPanel } from '../../components/ui/SimplifierPanel';
import { SchedulerPanel } from '../../components/ui/SchedulerPanel';
import { PDFAssistantPanel } from '../../components/ui/PDFAssistantPanel';
import { api, type UserResponse, type PDFListItem, type HealthResponse } from '../../services/api';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'voice' | 'scanner' | 'simplifier' | 'scheduler' | 'pdf-assistant'>('voice');

  // ── Health State ──
  const [health, setHealth] = useState<HealthResponse | null>(null);

  // ── Users State ──
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', full_name: '', role: 'pharmacist' as 'pharmacist' | 'admin', password: '' });
  const [creating, setCreating] = useState(false);

  // ── PDFs State ──
  const [pdfs, setPdfs] = useState<PDFListItem[]>([]);
  const [pdfsLoading, setPdfsLoading] = useState(true);
  const [pdfsError, setPdfsError] = useState('');
  const [pdfSearch, setPdfSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMedName, setUploadMedName] = useState('');
  const [uploading, setUploading] = useState(false);

  // ── Load Data ──
  useEffect(() => {
    loadHealth();
    loadUsers();
    loadPDFs();
  }, []);

  const loadHealth = async () => {
    try {
      const data = await api.healthCheck();
      setHealth(data);
    } catch { setHealth(null); }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch {
      setUsersError('No se pudo conectar con el endpoint de usuarios.');
    } finally { setUsersLoading(false); }
  };

  const loadPDFs = async () => {
    setPdfsLoading(true);
    setPdfsError('');
    try {
      const data = await api.listPDFs();
      setPdfs(data);
    } catch {
      setPdfsError('No se pudo conectar con el catálogo de PDFs.');
    } finally { setPdfsLoading(false); }
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.full_name || !createForm.password) return;
    setCreating(true);
    try {
      await api.createUser(createForm);
      setShowCreateModal(false);
      setCreateForm({ email: '', full_name: '', role: 'pharmacist', password: '' });
      loadUsers();
    } catch { alert('Error al crear usuario'); }
    finally { setCreating(false); }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!confirm(`¿Eliminar al usuario "${name}"?`)) return;
    try {
      await api.deleteUser(userId);
      loadUsers();
    } catch { alert('Error al eliminar usuario'); }
  };

  const handleUploadPDF = async () => {
    if (!uploadFile || !uploadMedName) return;
    setUploading(true);
    try {
      await api.uploadPDF(uploadFile, uploadMedName);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadMedName('');
      loadPDFs();
    } catch { alert('Error al subir PDF'); }
    finally { setUploading(false); }
  };

  const handleDeletePDF = async (pdfId: number, name: string) => {
    if (!confirm(`¿Eliminar el PDF "${name}"?`)) return;
    try {
      await api.deletePDF(pdfId);
      loadPDFs();
    } catch { alert('Error al eliminar PDF'); }
  };

  const handleDownloadPDF = async (pdfId: number) => {
    try {
      const url = await api.downloadPDF(pdfId);
      window.open(url, '_blank');
    } catch { alert('Error al descargar PDF'); }
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPdfs = pdfs.filter(p =>
    p.medication_name.toLowerCase().includes(pdfSearch.toLowerCase()) ||
    p.file_name.toLowerCase().includes(pdfSearch.toLowerCase())
  );

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-[#f0f4f8] p-2 rounded-xl text-[#004b7c]">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#004b7c] tracking-tight">PHARMAVOX S.A.</h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-[10px] font-bold text-[#004b7c] uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                Administrador / QA
              </div>
              {/* Health Indicator */}
              {health && (
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${health.status === 'healthy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${health.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                  {health.gemini_api_status === 'configured' ? 'Gemini OK' : 'Gemini ⚠'}
                </div>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider">CONTROL DE BUENAS PRÁCTICAS REGULATORIAS</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-800">Dra. Sofía Chávez</div>
            <div className="text-[10px] font-bold text-slate-400 lowercase tracking-wider">sofia.chavez@farmacorp.com</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#004b7c] text-white flex items-center justify-center font-bold">D</div>
          <div className="w-px h-8 bg-slate-200 mx-2"></div>
          <Link to="/login" className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content — Bento Grid 3 Columns */}
      <main className="flex-1 flex p-6 gap-6 overflow-hidden h-full max-w-[1800px] mx-auto w-full">
        
        {/* ═══ LEFT COLUMN: Users (CRUD) ═══ */}
        <div className="w-1/3 bg-white rounded-[2rem] border border-slate-200 flex flex-col shadow-sm">
          <div className="p-8 pb-4 border-b border-slate-100 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-800">
                USUARIOS {!usersLoading && `(${users.length})`}
              </h3>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="w-8 h-8 rounded-lg bg-[#004b7c] text-white flex items-center justify-center hover:bg-[#00385e] transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-8 flex-1 flex flex-col min-h-0">
            <div className="relative mb-6 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar usuario o cargo..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {usersLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-xs font-bold tracking-wider uppercase">Cargando usuarios...</p>
                </div>
              ) : usersError ? (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-700 text-sm flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-xs">Endpoint no disponible</p>
                    <p className="text-xs mt-0.5 opacity-80">{usersError}</p>
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No se encontraron usuarios.</div>
              ) : filteredUsers.map((user) => (
                <div key={user.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-200 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${user.role === 'admin' ? 'bg-[#004b7c]' : 'bg-emerald-600'} text-white flex items-center justify-center font-bold`}>
                      {user.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{user.full_name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 lowercase">{user.role === 'admin' ? 'QA/Admin' : 'Farmacéutico'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded uppercase ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {user.is_active ? 'Activo' : 'Baja'}
                    </div>
                    <button onClick={() => handleDeleteUser(user.id, user.full_name)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ CENTER COLUMN: AI Tools (5 tabs) ═══ */}
        <div className="w-1/3 flex flex-col gap-4">
          <div className="flex gap-1 shrink-0 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex-wrap">
            {([
              { key: 'voice', icon: Mic, label: 'Voz', color: 'bg-[#004b7c]' },
              { key: 'scanner', icon: Scan, label: 'Escáner', color: 'bg-blue-600' },
              { key: 'simplifier', icon: LayoutList, label: 'Simplificar', color: 'bg-indigo-600' },
              { key: 'scheduler', icon: Clock, label: 'Agenda', color: 'bg-emerald-600' },
              { key: 'pdf-assistant', icon: BookOpen, label: 'PDF', color: 'bg-violet-600' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 font-bold text-[11px] transition-all ${activeTab === tab.key ? `${tab.color} text-white shadow-md` : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0">
            {activeTab === 'voice' && <VoiceAssistantPanel context="Admin" title="Voz de Administrador" description="Consulte índices de POE en tiempo real o el estado de la red." />}
            {activeTab === 'scanner' && <ScannerPanel />}
            {activeTab === 'simplifier' && <SimplifierPanel />}
            {activeTab === 'scheduler' && <SchedulerPanel />}
            {activeTab === 'pdf-assistant' && <PDFAssistantPanel />}
          </div>
        </div>

        {/* ═══ RIGHT COLUMN: PDF Library (CRUD) ═══ */}
        <div className="w-1/3 bg-white rounded-[2rem] border border-slate-200 flex flex-col shadow-sm">
          <div className="p-8 pb-4 border-b border-slate-100 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-800">
                PDFS POE {!pdfsLoading && `(${pdfs.length})`}
              </h3>
            </div>
            <button onClick={() => setShowUploadModal(true)} className="w-8 h-8 rounded-lg bg-[#004b7c] text-white flex items-center justify-center hover:bg-[#00385e] transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-8 flex-1 flex flex-col min-h-0">
            <div className="relative mb-6 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={pdfSearch}
                onChange={(e) => setPdfSearch(e.target.value)}
                placeholder="Buscar manuales de producción..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {pdfsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-xs font-bold tracking-wider uppercase">Cargando catálogo...</p>
                </div>
              ) : pdfsError ? (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-700 text-sm flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-xs">Endpoint no disponible</p>
                    <p className="text-xs mt-0.5 opacity-80">{pdfsError}</p>
                  </div>
                </div>
              ) : filteredPdfs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No se encontraron documentos.</div>
              ) : filteredPdfs.map((pdf) => (
                <div key={pdf.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group" onClick={() => handleDownloadPDF(pdf.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004b7c] flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{pdf.medication_name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{pdf.file_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider rounded uppercase">
                      Activo
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeletePDF(pdf.id, pdf.medication_name); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 shrink-0 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Selecciona un PDF para consulta, edición o borrado
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ═══ MODAL: Create User ═══ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Crear Nuevo Usuario</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input type="text" value={createForm.full_name} onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})} className="w-full border-slate-300 rounded-lg py-2 px-3 border focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input type="email" value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})} className="w-full border-slate-300 rounded-lg py-2 px-3 border focus:ring-blue-500 focus:border-blue-500" placeholder="juan@pharmavox.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <input type="password" value={createForm.password} onChange={(e) => setCreateForm({...createForm, password: e.target.value})} className="w-full border-slate-300 rounded-lg py-2 px-3 border focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select value={createForm.role} onChange={(e) => setCreateForm({...createForm, role: e.target.value as 'pharmacist' | 'admin'})} className="w-full border-slate-300 rounded-lg py-2 px-3 border focus:ring-blue-500 focus:border-blue-500">
                  <option value="pharmacist">Farmacéutico</option>
                  <option value="admin">Administrador / QA</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                <button type="button" onClick={handleCreateUser} disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-[#004b7c] rounded-lg hover:bg-[#00385e] disabled:opacity-50 flex items-center gap-2">
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Upload PDF ═══ */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Subir Prospecto PDF</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Medicamento</label>
                <input type="text" value={uploadMedName} onChange={(e) => setUploadMedName(e.target.value)} className="w-full border-slate-300 rounded-lg py-2 px-3 border focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Paracetamol 500mg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Archivo PDF</label>
                {uploadFile ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700 flex-1 truncate">{uploadFile.name}</span>
                    <button onClick={() => setUploadFile(null)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all cursor-pointer">
                    <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-sm font-bold text-slate-600">Click para seleccionar</span>
                    <span className="text-xs text-slate-400 mt-1">PDF (Máx 50MB)</span>
                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setUploadFile(e.target.files[0])} />
                  </label>
                )}
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                <button type="button" onClick={handleUploadPDF} disabled={uploading || !uploadFile || !uploadMedName} className="px-4 py-2 text-sm font-medium text-white bg-[#004b7c] rounded-lg hover:bg-[#00385e] disabled:opacity-50 flex items-center gap-2">
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <UploadCloud className="w-4 h-4" />
                  Subir PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
