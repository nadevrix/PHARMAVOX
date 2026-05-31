import { useState, useEffect } from 'react';
import { FileText, Send, Loader2, BrainCircuit, Mic, BookOpen, AlertTriangle } from 'lucide-react';
import { api, type AskPDFResponse, type PDFListItem } from '../../services/api';

export function PDFAssistantPanel() {
  const [pdfs, setPdfs] = useState<PDFListItem[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [state, setState] = useState<'idle' | 'loading-pdfs' | 'processing' | 'responding' | 'error'>('idle');
  const [responseData, setResponseData] = useState<AskPDFResponse | null>(null);
  const [error, setError] = useState('');

  // Cargar lista de PDFs
  useEffect(() => {
    const loadPDFs = async () => {
      setState('loading-pdfs');
      try {
        const data = await api.listPDFs();
        setPdfs(data);
        if (data.length > 0) setSelectedPdfId(data[0].id);
        setState('idle');
      } catch {
        setError('No se pudo cargar el catálogo de PDFs. Verifique que el backend esté corriendo.');
        setState('error');
      }
    };
    loadPDFs();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || selectedPdfId === null) return;

    setState('processing');
    setResponseData(null);
    setError('');

    try {
      const data = await api.askAboutPDF(selectedPdfId, question);
      setResponseData(data);
      setState('responding');
    } catch {
      setError('Error al consultar la IA sobre el PDF. Verifique la conexión con el backend.');
      setState('error');
    }
  };

  const handleNewQuery = () => {
    setResponseData(null);
    setQuestion('');
    setState('idle');
    setError('');
  };

  const selectedPdf = pdfs.find(p => p.id === selectedPdfId);

  return (
    <div className="w-full h-full bg-[#0A1628] rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-xl shadow-slate-200/50">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1f3a] to-[#070e1a] opacity-60"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold tracking-wider mb-4 uppercase w-fit">
          📄 Consulta Inteligente de Prospectos
        </div>

        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Asistente de PDFs Médicos
        </h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Seleccione un prospecto PDF del catálogo e interrogue a la IA sobre su contenido. Las respuestas incluyen citas exactas del documento.
        </p>

        {/* PDF Selector */}
        <div className="mb-6 shrink-0">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Documento Activo
          </label>
          {state === 'loading-pdfs' ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-3">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando catálogo...
            </div>
          ) : pdfs.length > 0 ? (
            <select
              value={selectedPdfId ?? ''}
              onChange={(e) => setSelectedPdfId(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white/10 transition-all appearance-none cursor-pointer"
            >
              {pdfs.map((pdf) => (
                <option key={pdf.id} value={pdf.id} className="bg-slate-900 text-white">
                  {pdf.medication_name} — {pdf.file_name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-3 text-amber-400/80 text-sm bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              No hay PDFs disponibles. Un administrador debe subir prospectos primero.
            </div>
          )}
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 flex flex-col justify-center min-h-0 overflow-y-auto">
          {error && state === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-medium mb-4">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              {error}
              <button onClick={handleNewQuery} className="ml-auto text-xs font-bold bg-red-500/20 px-3 py-1 rounded-lg hover:bg-red-500/30 transition-colors">
                Reintentar
              </button>
            </div>
          )}

          {state === 'processing' && (
            <div className="flex flex-col items-center justify-center space-y-6 py-12">
              <Loader2 className="w-16 h-16 text-violet-400 animate-spin" />
              <p className="text-violet-400 font-medium tracking-widest text-sm animate-pulse uppercase">
                Analizando prospecto con IA...
              </p>
              {selectedPdf && (
                <p className="text-slate-500 text-xs">
                  Documento: {selectedPdf.medication_name}
                </p>
              )}
            </div>
          )}

          {state === 'idle' && !responseData && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-500/20">
                <BookOpen className="w-10 h-10 text-violet-400" />
              </div>
              <p className="text-slate-400 text-sm max-w-xs">
                Escriba una pregunta sobre el prospecto seleccionado para recibir una respuesta con citas del documento original.
              </p>
            </div>
          )}

          {state === 'responding' && responseData && (
            <div className="space-y-4 animate-fade-in">
              {/* Visual Layout Card */}
              <div className="bg-white p-6 rounded-2xl shadow-2xl border-t-4" style={{ borderColor: responseData.visual_layout.highlight_color }}>
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
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex gap-3 items-center mb-4">
                  <Mic className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <p className="text-sm text-slate-500 italic">
                    "{responseData.voice_response}"
                  </p>
                </div>

                {/* Sources / Citations */}
                {responseData.sources && responseData.sources.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Fuentes Citadas del PDF
                    </h4>
                    <div className="space-y-2">
                      {responseData.sources.map((source, idx) => (
                        <div key={idx} className="bg-violet-50 p-3 rounded-xl border border-violet-100 text-xs">
                          <div className="flex items-center gap-2 mb-1.5 text-violet-700 font-bold">
                            <BookOpen className="w-3.5 h-3.5" />
                            {source.document_name} — Pág. {source.page_number}
                          </div>
                          <p className="text-violet-600 font-medium mb-1">{source.section_title}</p>
                          <p className="text-slate-500 italic leading-relaxed">"{source.matched_text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
              placeholder="¿Cuáles son las contraindicaciones de este medicamento?"
              disabled={state === 'processing' || pdfs.length === 0}
              className="w-full pl-6 pr-14 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white/15 transition-all backdrop-blur-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!question.trim() || state === 'processing' || selectedPdfId === null}
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
