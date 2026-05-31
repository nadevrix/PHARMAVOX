import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LogOut, 
  Mic, 
  Search, 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  X,
  Plus,
  Users
} from 'lucide-react';
import { VoiceAssistantPanel } from '../../components/ui/VoiceAssistantPanel';
import { api, type UserResponse, type PDFListItem } from '../../services/api';

export function AdminDashboard() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [pdfs, setPdfs] = useState<PDFListItem[]>([]);
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [pdfSearch, setPdfSearch] = useState('');
  
  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  
  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isUploadPdfOpen, setIsUploadPdfOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<PDFListItem | null>(null);
  
  // Form states
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'pharmacist' | 'admin'>('pharmacist');
  const [newUserTimezone, setNewUserTimezone] = useState('America/Caracas');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // IA voice mode active state
  const [isIaActive, setIsIaActive] = useState(false);

  const userStr = localStorage.getItem('user');
  const loggedInUser = userStr ? JSON.parse(userStr) : null;
  const fullName = loggedInUser?.full_name || 'Dra. Sofia Chávez';
  
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Load users
  const loadUsersData = async () => {
    setLoadingUsers(true);
    try {
      const list = await api.getUsers();
      setUsers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load PDFs
  const loadPdfsData = async () => {
    setLoadingPdfs(true);
    try {
      const list = await api.listPDFs('admin');
      setPdfs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPdfs(false);
    }
  };

  useEffect(() => {
    loadUsersData();
    loadPdfsData();
  }, []);

  // Filter lists
  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPdfs = pdfs.filter(pdf => 
    pdf.filename.toLowerCase().includes(pdfSearch.toLowerCase())
  );

  // Dynamic LOT and status generator for PDFs
  const getPdfMetadata = (filename: string, index: number) => {
    if (filename.toLowerCase().includes('amox')) {
      return { lote: 'L-AMX-402', status: 'ACTIVO' };
    } else if (filename.toLowerCase().includes('ibup')) {
      return { lote: 'L-IBU-109', status: 'ACTIVO' };
    } else if (filename.toLowerCase().includes('parac')) {
      return { lote: 'L-PAR-301', status: 'OBSOLETO' };
    } else if (filename.toLowerCase().includes('react')) {
      return { lote: 'L-LMR-501', status: 'ACTIVO' };
    }
    return {
      lote: `L-POE-${100 + index}`,
      status: index % 3 === 2 ? 'OBSOLETO' : 'ACTIVO'
    };
  };

  // Submit new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!newUserFullName || !newUserEmail || !newUserPassword) {
      setFormError('Todos los campos son obligatorios.');
      return;
    }

    try {
      await api.createUser({
        email: newUserEmail,
        full_name: newUserFullName,
        password: newUserPassword,
        role: newUserRole,
        timezone: newUserTimezone
      });
      setFormSuccess('Usuario creado con éxito.');
      setNewUserEmail('');
      setNewUserFullName('');
      setNewUserPassword('');
      // Refresh list
      loadUsersData();
      setTimeout(() => {
        setIsAddUserOpen(false);
        setFormSuccess('');
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Error al crear el usuario.');
    }
  };

  // Submit PDF upload
  const handleUploadPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    if (!pdfFile) {
      setUploadError('Por favor seleccione un archivo PDF.');
      return;
    }

    try {
      await api.uploadPDF(pdfFile);
      setUploadSuccess('PDF subido y procesado con éxito.');
      setPdfFile(null);
      // Refresh list
      loadPdfsData();
      setTimeout(() => {
        setIsUploadPdfOpen(false);
        setUploadSuccess('');
      }, 1000);
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir el archivo.');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: number) => {
    if (confirm('¿Está seguro de dar de baja a este usuario?')) {
      try {
        await api.deleteUser(userId);
        setSelectedUser(null);
        loadUsersData();
      } catch (err: any) {
        alert(err.message || 'Error al eliminar el usuario.');
      }
    }
  };

  // Delete PDF
  const handleDeletePDF = async (pdfId: number) => {
    if (confirm('¿Está seguro de eliminar este prospecto del sistema?')) {
      try {
        await api.deletePDF(pdfId);
        setSelectedPdf(null);
        loadPdfsData();
      } catch (err: any) {
        alert(err.message || 'Error al eliminar el PDF.');
      }
    }
  };

  const handleDownloadPDF = (pdfId: number) => {
    api.downloadPDF(pdfId, 'admin');
  };

  return (
    <div className="h-screen w-screen bg-[#f8fafc] flex flex-col overflow-hidden font-sans">
      
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <img src="/logo_final.jpg" alt="PharmaVox Logo" className="w-14 h-auto object-contain mix-blend-multiply" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#00385F] uppercase" style={{ letterSpacing: '-0.03em' }}>
                PHARMAVOX S.A.
              </h1>
              <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider">
                🛡️ Administrador / QA
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">
              CONTROL DE BUENAS PRÁCTICAS REGULATORIAS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-800">{fullName}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{loggedInUser?.email || 'sofia.chavez@farmacorp.com'}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#002a54] text-white flex items-center justify-center font-bold shadow-md">
            {initials}
          </div>
          <div className="w-px h-8 bg-slate-200 mx-2"></div>
          <Link 
            to="/login" 
            onClick={() => localStorage.removeItem('user')}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <main className="flex-1 flex gap-6 p-6 overflow-hidden">
        
        {/* ================= COLUMN 1: USERS ================= */}
        <div className="flex-1 h-full flex flex-col bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm overflow-hidden">
          
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-md font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              Usuarios ({filteredUsers.length})
            </h3>
            <button 
              onClick={() => setIsAddUserOpen(true)}
              className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar usuario o cargo..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loadingUsers ? (
              <div className="text-center py-8 text-slate-400 text-xs uppercase tracking-widest font-bold">Cargando...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs uppercase tracking-widest font-bold">Sin resultados</div>
            ) : (
              filteredUsers.map(u => {
                const uInitials = u.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const isUserAdmin = u.role === 'admin';
                return (
                  <div 
                    key={u.id}
                    className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-black uppercase ${
                        isUserAdmin ? 'bg-[#002a54]' : 'bg-emerald-500'
                      }`}>
                        {uInitials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{u.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">
                          {isUserAdmin ? 'QA/Producción' : 'operario'}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedUser(u)}
                      className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      Info
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center justify-center text-center shrink-0">
            <Users className="w-8 h-8 text-slate-200 mb-1" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Selecciona un usuario para control o baja
            </p>
          </div>
        </div>

        {/* ================= COLUMN 2: CENTER AI CONTROL ================= */}
        <div className="flex-1.2 h-full flex flex-col">
          {isIaActive ? (
            <div className="flex-1 relative rounded-[2rem] overflow-hidden shadow-xl">
              <VoiceAssistantPanel 
                context="Auditor" 
                title="Vox Canal Regulador"
                description="Audite y compruebe índices de POE en planta."
              />
              <button 
                onClick={() => setIsIaActive(false)}
                className="absolute top-8 right-8 z-20 flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider shadow-md"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar Canal
              </button>
            </div>
          ) : (
            <div className="flex-1 bg-gradient-to-br from-[#0c1a30] via-[#050f21] to-[#040e21] rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl border border-white/5">
              <div className="absolute top-[-25%] left-[-25%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px]"></div>
              
              {/* Top Badge */}
              <div className="w-full text-center relative z-10">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-blue-300 bg-blue-500/10 text-[10px] font-black uppercase tracking-widest border border-blue-400/20">
                  🧬 Cabina de Comunicación
                </span>
              </div>

              {/* Center Controls */}
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto my-6 relative z-10">
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3 uppercase">
                  Canal de Voz PharmaVox
                </h2>
                <p className="text-slate-400 text-xs leading-relaxed mb-8">
                  Acceso regulatorio completo con el asistente de voz. Audita y comprueba índices de POE en tiempo real.
                </p>

                {/* Glowing Button */}
                <button 
                  onClick={() => setIsIaActive(true)}
                  className="group relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all duration-300 transform hover:scale-105"
                >
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping group-hover:duration-1000"></div>
                  <div className="flex flex-col items-center justify-center">
                    <Mic className="w-8 h-8 text-white animate-pulse" />
                    <span className="text-[8px] font-black text-blue-200 tracking-widest uppercase mt-1">
                      Ingresar IA
                    </span>
                  </div>
                </button>
              </div>

              {/* Bottom status indicator */}
              <div className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl relative z-10">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-wider">
                    Estado de la Red Copiloto
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  El asistente RAG combina Amoxicilina, Ibuprofeno y Limpieza de Reactores. El comando "PharmaVox" inicia el micrófono de forma autónoma.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ================= COLUMN 3: PDFS ================= */}
        <div className="flex-1 h-full flex flex-col bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm overflow-hidden">
          
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-md font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              PDFs POE ({filteredPdfs.length})
            </h3>
            <button 
              onClick={() => setIsUploadPdfOpen(true)}
              className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar manuales de producción..."
              value={pdfSearch}
              onChange={(e) => setPdfSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loadingPdfs ? (
              <div className="text-center py-8 text-slate-400 text-xs uppercase tracking-widest font-bold">Cargando...</div>
            ) : filteredPdfs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs uppercase tracking-widest font-bold">Sin resultados</div>
            ) : (
              filteredPdfs.map((pdf, index) => {
                const meta = getPdfMetadata(pdf.filename, index);
                return (
                  <div 
                    key={pdf.id}
                    onClick={() => setSelectedPdf(pdf)}
                    className="flex justify-between items-center p-3.5 border border-slate-100 rounded-xl bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 truncate max-w-[150px]">
                          {pdf.filename.replace('.pdf', '')}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                          Lote: {meta.lote}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                      meta.status === 'ACTIVO' 
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                        : 'text-rose-700 bg-rose-50 border-rose-200'
                    }`}>
                      {meta.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center justify-center text-center shrink-0">
            <FileText className="w-8 h-8 text-slate-200 mb-1" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Selecciona un PDF para consulta, edición o borrado
            </p>
          </div>
        </div>

      </main>

      {/* ================= MODALS & POPUPS ================= */}

      {/* Modal Add User */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl relative border border-slate-100 animate-fade-in">
            <button 
              onClick={() => setIsAddUserOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
              Crear Nuevo Usuario
            </h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-6">
              Registre credenciales y asigne roles autorizados.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Nombre Completo</label>
                <input 
                  type="text"
                  placeholder="Ej. Carlos Mendoza"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Email</label>
                <input 
                  type="email"
                  placeholder="carlos.mendoza@farmacorp.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Contraseña</label>
                <input 
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Rol</label>
                  <select 
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  >
                    <option value="pharmacist">Operario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Zona Horaria</label>
                  <input 
                    type="text"
                    value={newUserTimezone}
                    onChange={(e) => setNewUserTimezone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {formError && <p className="text-[10px] font-bold text-rose-500 text-center uppercase tracking-widest">{formError}</p>}
              {formSuccess && <p className="text-[10px] font-bold text-emerald-500 text-center uppercase tracking-widest">{formSuccess}</p>}

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl shadow-md transition-all mt-4"
              >
                Crear Usuario
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload PDF */}
      {isUploadPdfOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl relative border border-slate-100 animate-fade-in">
            <button 
              onClick={() => setIsUploadPdfOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
              Subir PDF POE
            </h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-6">
              Sube el manual técnico del fármaco. La IA lo procesará para el asistente RAG.
            </p>

            <form onSubmit={handleUploadPDF} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                <input 
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 text-slate-400 mb-3" />
                <span className="text-xs font-bold text-slate-600">
                  {pdfFile ? pdfFile.name : 'Seleccionar Archivo PDF'}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">
                  Máximo 10MB
                </span>
              </div>

              {uploadError && <p className="text-[10px] font-bold text-rose-500 text-center uppercase tracking-widest">{uploadError}</p>}
              {uploadSuccess && <p className="text-[10px] font-bold text-emerald-500 text-center uppercase tracking-widest">{uploadSuccess}</p>}

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl shadow-md transition-all mt-4"
              >
                Procesar Documento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Selected User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 shadow-2xl relative border border-slate-100 animate-fade-in">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-[#002a54] text-xl font-black uppercase border border-slate-200 mb-4 shadow-inner">
                {selectedUser.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <h3 className="text-lg font-black text-slate-800">{selectedUser.full_name}</h3>
              <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                {selectedUser.role === 'admin' ? 'Administrador / QA' : 'Operario Autorizado'}
              </span>

              <div className="w-full mt-6 space-y-3 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Email</span>
                  <span className="text-xs font-bold text-slate-700">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Zona Horaria</span>
                  <span className="text-xs font-bold text-slate-700">{selectedUser.timezone || 'UTC'}</span>
                </div>
              </div>

              {/* Prevent deleting self */}
              {loggedInUser?.id !== selectedUser.id ? (
                <button 
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl shadow-md transition-all mt-6 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Dar de Baja
                </button>
              ) : (
                <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-6 tracking-wider">Sesión Activa - No se puede eliminar</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected PDF Detail Modal */}
      {selectedPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 shadow-2xl relative border border-slate-100 animate-fade-in">
            <button 
              onClick={() => setSelectedPdf(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-inner border border-blue-100">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-800 line-clamp-2 max-w-[250px]">
                {selectedPdf.filename}
              </h3>
              
              <div className="w-full mt-6 space-y-3 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tamaño</span>
                  <span className="text-xs font-bold text-slate-700">
                    {(selectedPdf.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fecha de Carga</span>
                  <span className="text-xs font-bold text-slate-700">
                    {selectedPdf.created_at ? new Date(selectedPdf.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 mt-6">
                <button 
                  onClick={() => handleDownloadPDF(selectedPdf.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Bajar
                </button>
                <button 
                  onClick={() => handleDeletePDF(selectedPdf.id)}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-[9px] font-black tracking-widest text-slate-400 uppercase bg-white border-t border-slate-200 shrink-0">
        PharmaVox © 2026 • Plataforma de Seguridad Farmacológica • Chávez S.A.
      </footer>
    </div>
  );
}
