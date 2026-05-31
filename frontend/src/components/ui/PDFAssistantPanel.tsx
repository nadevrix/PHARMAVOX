import { useState, useEffect } from 'react';
import { Send, Loader2, BrainCircuit, AlertTriangle, BookOpen, HelpCircle } from 'lucide-react';
import { api, type AskResponse, type PDFListItem } from '../../services/api';

export function PDFAssistantPanel() {
  const [pdfs, setPdfs] = useState<PDFListItem[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [state, setState] = useState<'idle' | 'loading_pdfs' | 'processing' | 'responding' | 'error'>('idle');
  const [responseData, setResponseData] = useState<AskResponse | null>(null);
  const [error, setError] = useState('');

  const loadPDFs = async () => {
    setState('loading_pdfs');
    try {
      const data = await api.listPDFs('pharmacist');
      setPdfs(data);
      if (data.length > 0) {
        setSelectedPdfId(data[0].id.toString());
      }
      setState('idle');
    } catch {
      setError('No se pudo cargar la lista de prospectos desde el servidor.');
      setState('error');
    }
  };

  useEffect(() => {
    loadPDFs();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    // Buscar el PDF seleccionado para mandar su nombre como contexto
    const selectedPdf = pdfs.find(p => p.id.toString() === selectedPdfId);
    const context = selectedPdf ? `Archivo PDF: ${selectedPdf.filename}` : '';

    setState('processing');
    setResponseData(null);
    setError('');

    try {
      const data = await api.askAssistant(question, context);
      setResponseData(data);
      setState('responding');
    } catch {
      setError('Error al consultar el Asistente RAG. Verifique el backend.');
      setState('error');
    }
  };

  const handleNewQuery = () => {
    setResponseData(null);
    setQuestion('');
    setState('idle');
    setError('');
  };

  return (
    <div className="w-full h-full bg-[#0A1628] rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-xl shadow-slate-200/50">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1f3a] to-[#070e1a] opacity-60"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold tracking-wider mb-4 uppercase w-fit">
          📄 Consulta Inteligente RAG
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase" style={{ letterSpacing: '-0.02em' }}>
          Consulta de Documentación RAG
        </h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
          Pregunte directamente sobre los prospectos clínicos indexados en la base vectorial del sistema.
        </p>

        {/* PDF Selection Dropdown */}
        <div className="mb-6 shrink-0">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Seleccionar Prospecto Clínico de Referencia
          </label>
          <div className="relative">
            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            {state === 'loading_pdfs' ? (
              <div className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-sm animate-pulse">
                Cargando prospectos médicos...
              </div>
            ) : pdfs.length === 0 ? (
              <div className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-rose-300 text-sm">
                No hay prospectos clínicos indexados. ¡Sube un PDF como Admin primero!
              </div>
            ) : (
              <select
                value={selectedPdfId}
                onChange={(e) => setSelectedPdfId(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-[#0c1a30] transition-all appearance-none cursor-pointer"
              >
                {pdfs.map((pdf) => (
                  <option key={pdf.id} value={pdf.id.toString()} className="bg-[#0A1628] text-white">
                    {pdf.filename}
                  </option>
                ))}
              </select>
            )}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white font-bold">▼</div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 flex flex-col justify-center min-h-0 overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-medium mb-4">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={loadPDFs} className="ml-auto text-xs font-bold bg-red-500/20 px-3 py-1 rounded-lg hover:bg-red-500/30 transition-colors">
                Reintentar
              </button>
            </div>
          )}

          {state === 'processing' && (
            <div className="flex flex-col items-center justify-center space-y-6 py-12">
              <Loader2 className="w-16 h-16 text-violet-400 animate-spin" />
              <p className="text-violet-400 font-bold tracking-widest text-sm animate-pulse uppercase">
                IA Analizando Base Vectorial...
              </p>
              {selectedPdfId && (
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  Analizando: {pdfs.find(p => p.id.toString() === selectedPdfId)?.filename}
                </p>
              )}
            </div>
          )}

          {state === 'idle' && !responseData && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-500/20">
                <HelpCircle className="w-10 h-10 text-violet-400" />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider max-w-xs">
                Seleccione el prospecto médico arriba y formule su pregunta abajo para que FarmaVox lo analice.
              </p>
            </div>
          )}

          {state === 'responding' && responseData && (
            <div className="space-y-4 animate-fade-in my-auto">
              {/* Visual Layout Card */}
              <div className="bg-white p-6 rounded-3xl shadow-2xl border-t-8" style={{ borderColor: responseData.visual_layout.highlight_color }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="w-8 h-8" style={{ color: responseData.visual_layout.highlight_color }} />
                    <h3 className="text-xl font-extrabold text-slate-800">
                      {responseData.visual_layout.title}
                    </h3>
                  </div>
                  <button onClick={handleNewQuery} className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                    Nueva Consulta
                  </button>
                </div>

                <ul className="space-y-3 mb-6">
                  {responseData.visual_layout.content_bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: responseData.visual_layout.highlight_color }}></div>
                      <span className="text-slate-600 font-medium leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Voice Response */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex gap-3 items-center">
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                  <p className="text-xs font-bold text-slate-500 italic">
                    "{responseData.voice_response}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="mt-auto pt-4 shrink-0">
          <form onSubmit={handleSubmit} className="relative w-full">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Pregunte sobre el medicamento... ej: ¿Cuáles son las dosis recomendadas?"
              disabled={state === 'processing' || pdfs.length === 0}
              className="w-full pl-6 pr-14 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white/15 transition-all backdrop-blur-sm disabled:opacity-50 text-sm"
            />
            <button
              type="submit"
              disabled={!question.trim() || state === 'processing' || pdfs.length === 0}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white disabled:opacity-50 disabled:bg-slate-600 hover:bg-violet-600 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
