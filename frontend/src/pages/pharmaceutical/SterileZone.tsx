import { useState, useEffect } from 'react';
import { LogOut, Mic, Search, FileText, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VoiceAssistantPanel } from '../../components/ui/VoiceAssistantPanel';
import { api, type PDFListItem } from '../../services/api';

export function SterileZone() {
  const [isIaActive, setIsIaActive] = useState(false);
  const [pdfs, setPdfs] = useState<PDFListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const fullName = user?.full_name || 'Carlos Mendoza';
  const roleLabel = user?.role === 'admin' ? 'Administrador / QA' : 'Operario Autorizado';
  
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Load PDFs from database
  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const list = await api.listPDFs();
        setPdfs(list);
      } catch (err) {
        console.error('Error fetching PDFs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPDFs();
  }, []);

  // Filter PDFs
  const filteredPdfs = pdfs.filter(pdf => 
    pdf.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status mapping to replicate mockup beautifully
  const getMockMetadata = (filename: string, index: number) => {
    // Replicate exactly the values in the user's mockup, with dynamic fallbacks
    if (filename.toLowerCase().includes('amox')) {
      return { lote: 'L-AMX-402', status: 'ACTIVO' };
    } else if (filename.toLowerCase().includes('ibup')) {
      return { lote: 'L-IBU-109', status: 'ACTIVO' };
    } else if (filename.toLowerCase().includes('parac')) {
      return { lote: 'L-PAR-301', status: 'OBSOLETO' };
    }
    // Fallback based on index
    return {
      lote: `L-POE-${100 + index}`,
      status: index % 3 === 2 ? 'OBSOLETO' : 'ACTIVO'
    };
  };

  const handleDownloadPDF = (pdfId: number) => {
    api.downloadPDF(pdfId, user?.role || 'pharmacist');
  };

  return (
    <div className="h-screen w-screen bg-[#f8fafc] flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <img src="/logo_final.jpg" alt="PharmaVox Logo" className="w-14 h-auto object-contain mix-blend-multiply" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#00385F] uppercase" style={{ letterSpacing: '-0.03em' }}>PHARMAVOX</h1>
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">CABINA ESTÉRIL DE FARMACIA • CHÁVEZ S.A.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-800">{fullName}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{roleLabel}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#004b7c] text-white flex items-center justify-center font-bold shadow-md">
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

      {/* Main Content — Split Layout (Left: voice/active panel, Right: PDF list) */}
      <main className="flex-1 flex gap-8 p-8 overflow-hidden">
        
        {/* ================= LEFT COLUMN: VOICE INTERACTION ================= */}
        <div className="flex-1 h-full flex flex-col">
          {isIaActive ? (
            <div className="flex-1 relative rounded-[2rem] overflow-hidden shadow-xl">
              {/* Force Active mode in panel directly */}
              <VoiceAssistantPanel 
                context="Operario" 
                title="Voz Manos Libres"
                description="Hable para consultar información clínica."
              />
              {/* Overlay Exit button synchronized with component exit */}
              <button 
                onClick={() => setIsIaActive(false)}
                className="absolute top-8 right-8 z-20 flex items-center gap-1.5 bg-rose-50 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider shadow-md"
              >
                <LogOut className="w-3.5 h-3.5" />
                Desactivar IA
              </button>
            </div>
          ) : (
            <div className="flex-1 bg-gradient-to-br from-[#0c1a30] via-[#050f21] to-[#040e21] rounded-[2rem] p-12 flex flex-col justify-between relative overflow-hidden shadow-2xl border border-white/5">
              {/* Background glows */}
              <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]"></div>
              
              {/* Badge */}
              <div className="w-full relative z-10">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-emerald-400 bg-emerald-400/10 text-[10px] font-black uppercase tracking-widest border border-emerald-400/20">
                  ✨ Inteligencia Farmacológica
                </span>
              </div>

              {/* Center Voice Prompt */}
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-8 relative z-10">
                <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4 uppercase">
                  Voz Manos Libres
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-12">
                  Inicie la cabina y realice consultas de POE sin frotar ni interactuar con pantallas físicas para mantener la estricta esterilidad en planta.
                </p>

                {/* Pulse Button circle */}
                <button 
                  onClick={() => setIsIaActive(true)}
                  className="group relative flex items-center justify-center w-36 h-36 rounded-full bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-[0_0_50px_rgba(37,99,235,0.4)] transition-all duration-300 transform hover:scale-105"
                >
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping group-hover:duration-1000"></div>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Mic className="w-10 h-10 text-white animate-pulse" />
                    <span className="text-[10px] font-black text-blue-200 tracking-widest uppercase mt-1">
                      Ingresar IA
                    </span>
                  </div>
                </button>
              </div>

              {/* Bottom Quick Guide */}
              <div className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl relative z-10">
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  Guía Rápida Manos Libres
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Al presionar, PharmaVox habilitará el canal. Diga <strong className="text-white font-extrabold">"PharmaVox"</strong> para activarlo, el cual apagará el sensor si detecta 10 segundos continuos de silencio en la sala de formulación.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: PDF LIBRARY ================= */}
        <div className="w-[450px] h-full flex flex-col bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="mb-6 shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-50 text-[#004b7c] border border-blue-100">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  Biblioteca de PDFs POE ({filteredPdfs.length})
                </h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  La IA analiza el contenido integrado de todos estos documentos.
                </p>
              </div>
            </div>
          </div>

          {/* Search box */}
          <div className="relative mb-6 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar manual o ingredientes de POE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* List of PDFs */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
                Cargando biblioteca...
              </div>
            ) : filteredPdfs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
                No se encontraron documentos
              </div>
            ) : (
              filteredPdfs.map((pdf, index) => {
                const meta = getMockMetadata(pdf.filename, index);
                return (
                  <div 
                    key={pdf.id}
                    onClick={() => handleDownloadPDF(pdf.id)}
                    className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl shadow-sm bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 group-hover:text-[#004b7c] transition-colors">
                          {pdf.filename.replace('.pdf', '')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                          Lote: {meta.lote}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest border ${
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

          {/* Bottom helper */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center justify-center text-center shrink-0">
            <FileText className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Presione un PDF de la biblioteca para visualizar su contenido
            </p>
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
