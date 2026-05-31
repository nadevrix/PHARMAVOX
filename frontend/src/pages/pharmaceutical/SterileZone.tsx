import { useState, useEffect } from 'react';
import { LogOut, Mic, Search, FileText, BrainCircuit, Scan, LayoutList, Clock, Loader2, AlertTriangle, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VoiceAssistantPanel } from '../../components/ui/VoiceAssistantPanel';
import { ScannerPanel } from '../../components/ui/ScannerPanel';
import { SimplifierPanel } from '../../components/ui/SimplifierPanel';
import { SchedulerPanel } from '../../components/ui/SchedulerPanel';
import { PDFAssistantPanel } from '../../components/ui/PDFAssistantPanel';
import { api, type PDFListItem } from '../../services/api';

export function SterileZone() {
  const [activeTab, setActiveTab] = useState<'voice' | 'scanner' | 'simplifier' | 'scheduler' | 'pdf-assistant'>('voice');

  // ── PDFs State ──
  const [pdfs, setPdfs] = useState<PDFListItem[]>([]);
  const [pdfsLoading, setPdfsLoading] = useState(true);
  const [pdfsError, setPdfsError] = useState('');
  const [pdfSearch, setPdfSearch] = useState('');

  useEffect(() => {
    loadPDFs();
  }, []);

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

  const handleDownloadPDF = async (pdfId: number) => {
    try {
      const url = await api.downloadPDF(pdfId);
      window.open(url, '_blank');
    } catch { alert('Error al descargar PDF'); }
  };

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
              <h1 className="text-lg font-bold text-[#004b7c] tracking-tight">PHARMAVOX</h1>
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider">CABINA ESTÉRIL DE FARMACIA • CHÁVEZ S.A.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-800">Carlos Mendoza</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operario Autorizado</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#004b7c] text-white flex items-center justify-center font-bold">
            C
          </div>
          <div className="w-px h-8 bg-slate-200 mx-2"></div>
          <Link to="/login" className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content — Bento Grid 2 Columns */}
      <main className="flex-1 flex p-8 gap-8 overflow-hidden h-full max-w-[1600px] mx-auto w-full">
        
        {/* ═══ LEFT: AI Tools (5 tabs) ═══ */}
        <div className="w-1/2 flex flex-col gap-4">
          <div className="flex gap-1.5 shrink-0 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
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
                className={`flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === tab.key ? `${tab.color} text-white shadow-md` : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0">
            {activeTab === 'voice' && <VoiceAssistantPanel context="Operario" />}
            {activeTab === 'scanner' && <ScannerPanel />}
            {activeTab === 'simplifier' && <SimplifierPanel />}
            {activeTab === 'scheduler' && <SchedulerPanel />}
            {activeTab === 'pdf-assistant' && <PDFAssistantPanel />}
          </div>
        </div>

        {/* ═══ RIGHT: PDF Library (read-only, dynamic) ═══ */}
        <div className="w-1/2 bg-white rounded-[2rem] border border-slate-200 flex flex-col shadow-sm">
          <div className="p-8 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-800">
                BIBLIOTECA DE PDFS POE {!pdfsLoading && `(${pdfs.length})`}
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              La IA analiza el contenido integrado de todos estos documentos durante las consultas.
            </p>
          </div>
          
          <div className="p-8 flex-1 flex flex-col min-h-0">
            <div className="relative mb-6 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={pdfSearch}
                onChange={(e) => setPdfSearch(e.target.value)}
                placeholder="Buscar manual o ingredientes de POE..." 
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
                <div key={pdf.id} onClick={() => handleDownloadPDF(pdf.id)} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{pdf.medication_name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{pdf.file_name}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider rounded uppercase">
                    Activo
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 shrink-0 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Presione un PDF de la biblioteca para visualizar su contenido
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase bg-slate-50 shrink-0">
        PharmaVox © 2026 • Plataforma de Seguridad Farmacológica • Chávez S.A.
      </footer>
    </div>
  );
}
