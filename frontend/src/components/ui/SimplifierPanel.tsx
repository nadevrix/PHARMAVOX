import { useState } from 'react';
import { AlignLeft, Sparkles, Loader2, Info, AlertTriangle, Clock } from 'lucide-react';
import { api, type SimplifyResponse } from '../../services/api';

export function SimplifierPanel() {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SimplifyResponse | null>(null);
  const [error, setError] = useState('');

  const handleSimplify = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setError('');
    
    try {
      const data = await api.simplifyText(text);
      setResult(data);
    } catch (err) {
      setError('Error al procesar el texto. Verifique la conexión con el backend.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'warning': return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      case 'dosage': return <Clock className="w-6 h-6 text-blue-500" />;
      case 'pain_relief': return <Sparkles className="w-6 h-6 text-emerald-500" />;
      default: return <Info className="w-6 h-6 text-indigo-500" />;
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-200">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-wider mb-2 uppercase">
            📝 Lenguaje Claro
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Simplificador Clínico</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {!result ? (
          <div className="flex flex-col h-full">
            <p className="text-sm text-slate-500 mb-4 shrink-0">
              Pegue un prospecto médico, manual POE o texto clínico complejo. La IA extraerá los puntos vitales en un lenguaje comprensible.
            </p>
            <div className="flex-1 relative mb-4 min-h-[200px]">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Pegue aquí el texto clínico complejo..."
                className="w-full h-full p-5 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm text-slate-700 placeholder:text-slate-400"
              />
              <AlignLeft className="absolute right-4 top-4 text-slate-300 w-5 h-5 pointer-events-none" />
            </div>
            
            {error && <p className="text-red-500 text-sm font-medium mb-4 shrink-0">{error}</p>}
            
            <button
              onClick={handleSimplify}
              disabled={!text.trim() || isProcessing}
              className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-2 shrink-0"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Procesando con IA...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Simplificar Texto</>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="flex items-center justify-between mb-6 shrink-0 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <h3 className="text-xl font-bold text-indigo-900">{result.simplified_title}</h3>
              <button 
                onClick={() => setResult(null)}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Nuevo Texto
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {result.sections.map((section, idx) => (
                <div key={idx} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      {getIcon(section.icon)}
                    </div>
                    <h4 className="font-bold text-slate-800">{section.title}</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed pl-14">
                    {section.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
