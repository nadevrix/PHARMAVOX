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
  
  // Inline selection states (replaces modals!)
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<PDFListItem | null>(null);
  
  // Inline forms toggles
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  // Inline Form fields
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'pharmacist' | 'admin'>('pharmacist');
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
      setFormError('Rellene todos los campos.');
      return;
    }

    try {
      await api.createUser({
        email: newUserEmail,
        full_name: newUserFullName,
        password: newUserPassword,
        role: newUserRole,
        timezone: 'America/Caracas'
      });
      setFormSuccess('Creado con éxito.');
      setNewUserEmail('');
      setNewUserFullName('');
      setNewUserPassword('');
      // Refresh list
      loadUsersData();
      setTimeout(() => {
        setShowAddUserForm(false);
        setFormSuccess('');
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Error al crear.');
    }
  };

  // Submit PDF upload
  const handleUploadPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    if (!pdfFile) {
      setUploadError('Seleccione un PDF.');
      return;
    }

    try {
      await api.uploadPDF(pdfFile);
      setUploadSuccess('Subido con éxito.');
      setPdfFile(null);
      // Refresh list
      loadPdfsData();
      setTimeout(() => {
        setShowUploadForm(false);
        setUploadSuccess('');
      }, 1000);
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir.');
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
        alert(err.message || 'Error al eliminar.');
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
        alert(err.message || 'Error al eliminar.');
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
              onClick={() => setShowAddUserForm(!showAddUserForm)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-white ${
                showAddUserForm ? 'bg-slate-500 hover:bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title="Añadir usuario inline"
            >
              {showAddUserForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {/* Inline Add User Form */}
          {showAddUserForm && (
            <form onSubmit={handleCreateUser} className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shrink-0 animate-fade-in">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nuevo Operario/Admin</div>
              <input 
                type="text"
                placeholder="Nombre Completo"
                value={newUserFullName}
                onChange={(e) => setNewUserFullName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <input 
                type="email"
                placeholder="Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="password"
                  placeholder="Contraseña"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <select 
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="pharmacist">Operario</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formError && <p className="text-[9px] font-bold text-rose-500 text-center uppercase tracking-widest">{formError}</p>}
              {formSuccess && <p className="text-[9px] font-bold text-emerald-500 text-center uppercase tracking-widest">{formSuccess}</p>}

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors"
              >
                Guardar Usuario
              </button>
            </form>
          )}

          {/* Search */}
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar usuario o cargo..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[150px]">
            {loadingUsers ? (
              <div className="text-center py-8 text-slate-400 text-xs uppercase tracking-widest font-bold">Cargando...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs uppercase tracking-widest font-bold">Sin resultados</div>
            ) : (
              filteredUsers.map(u => {
                const uInitials = u.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const isUserAdmin = u.role === 'admin';
                const isSelected = selectedUser?.id === u.id;
                return (
                  <div 
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`flex justify-between items-center p-3 border rounded-xl transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                    }`}
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
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Ver
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Inline User Control Card */}
          <div className="mt-4 pt-4 border-t border-slate-200 shrink-0">
            {selectedUser ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 animate-fade-in relative">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#002a54] text-white flex items-center justify-center text-[10px] font-black uppercase">
                    {selectedUser.full_name[0]}
                  </div>
                  <div className="text-xs font-black text-slate-800 truncate max-w-[180px]">
                    {selectedUser.full_name}
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                  Email: <span className="text-slate-600 font-extrabold normal-case">{selectedUser.email}</span>
                </div>
                {loggedInUser?.id !== selectedUser.id ? (
                  <button 
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Dar de Baja
                  </button>
                ) : (
                  <div className="text-center text-[9px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 py-1.5 rounded-lg border border-slate-200">
                    🔒 Sesión Activa (No Borrable)
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-2 text-slate-400">
                <Users className="w-8 h-8 text-slate-200 mb-1" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Selecciona un usuario para control o baja
                </p>
              </div>
            )}
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
              onClick={() => setShowUploadForm(!showUploadForm)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-white ${
                showUploadForm ? 'bg-slate-500 hover:bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title="Subir PDF inline"
            >
              {showUploadForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {/* Inline Upload PDF Form */}
          {showUploadForm && (
            <form onSubmit={handleUploadPDF} className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shrink-0 animate-fade-in">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargar Prospecto Clínico</div>
              <div className="relative border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-colors cursor-pointer text-center">
                <input 
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[180px]">
                  {pdfFile ? pdfFile.name : 'Seleccionar PDF'}
                </span>
              </div>

              {uploadError && <p className="text-[9px] font-bold text-rose-500 text-center uppercase tracking-widest">{uploadError}</p>}
              {uploadSuccess && <p className="text-[9px] font-bold text-emerald-500 text-center uppercase tracking-widest">{uploadSuccess}</p>}

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors"
              >
                Procesar PDF
              </button>
            </form>
          )}

          {/* Search */}
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar manuales de producción..."
              value={pdfSearch}
              onChange={(e) => setPdfSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* PDF List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[150px]">
            {loadingPdfs ? (
              <div className="text-center py-8 text-slate-400 text-xs uppercase tracking-widest font-bold">Cargando...</div>
            ) : filteredPdfs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs uppercase tracking-widest font-bold">Sin resultados</div>
            ) : (
              filteredPdfs.map((pdf, index) => {
                const meta = getPdfMetadata(pdf.filename, index);
                const isSelected = selectedPdf?.id === pdf.id;
                return (
                  <div 
                    key={pdf.id}
                    onClick={() => setSelectedPdf(pdf)}
                    className={`flex justify-between items-center p-3 border rounded-xl transition-all cursor-pointer group ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 truncate max-w-[130px]">
                          {pdf.filename.replace('.pdf', '')}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                          Lote: {meta.lote}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border shrink-0 ${
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

          {/* Inline PDF Control Card */}
          <div className="mt-4 pt-4 border-t border-slate-200 shrink-0">
            {selectedPdf ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 animate-fade-in relative">
                <button 
                  onClick={() => setSelectedPdf(null)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-100">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-slate-800 truncate max-w-[180px]">
                    {selectedPdf.filename}
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                  Tamaño: <span className="text-slate-600 font-extrabold">{(selectedPdf.file_size / 1024).toFixed(1)} KB</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleDownloadPDF(selectedPdf.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Bajar
                  </button>
                  <button 
                    onClick={() => handleDeletePDF(selectedPdf.id)}
                    className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Borrar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-2 text-slate-400">
                <FileText className="w-8 h-8 text-slate-200 mb-1" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Selecciona un PDF para consulta, edición o borrado
                </p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-[9px] font-black tracking-widest text-slate-400 uppercase bg-white border-t border-slate-200 shrink-0">
        PharmaVox © 2026 • Plataforma de Seguridad Farmacológica • Chávez S.A.
      </footer>
    </div>
  );
}
