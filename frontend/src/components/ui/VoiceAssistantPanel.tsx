import { useState, useEffect } from 'react';
import { Mic, BrainCircuit, Send, Loader2, PowerOff, AudioLines } from 'lucide-react';
import { AudioVisualizer } from '../AudioVisualizer';
import { api, type AskResponse } from '../../services/api';

interface VoiceAssistantPanelProps {
  context: string;
  themeColor?: string;
  title?: string;
  description?: string;
}

export function VoiceAssistantPanel({
  context,
  title = "Canal de Voz PharmaVox",
  description = "Diga 'PharmaVox' para activar el micrófono y realizar su consulta médica."
}: VoiceAssistantPanelProps) {
  const [state, setState] = useState<'standby' | 'listening' | 'processing' | 'responding' | 'error'>('standby');
  const [question, setQuestion] = useState('');
  const [responseData, setResponseData] = useState<AskResponse | null>(null);

  // ── 1. WAKE WORD DETECTION (Escucha Pasiva) ──
  useEffect(() => {
    if (state !== 'standby') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return; // Browser no soporta reconocimiento de voz nativo

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.toLowerCase();
      if (transcript.includes('pharmavox') || transcript.includes('farma vox') || transcript.includes('farmavox')) {
        setState('listening');
        recognition.stop();
      }
    };

    try {
      recognition.start();
    } catch (e) {
      // Ignorar si ya está corriendo
    }

    return () => {
      try { recognition.stop(); } catch (e) { }
    };
  }, [state]);

  // ── 2. STANDBY AUTOMÁTICO (10 Segundos) ──
  useEffect(() => {
    if (state === 'responding') {
      const timer = setTimeout(() => {
        setState('standby');
        setResponseData(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    setState('processing');
    setResponseData(null);

    try {
      const data = await api.askAssistant(question, context);
      setResponseData(data);
      setState('responding');
    } catch (error) {
      console.error(error);
      setResponseData({
        text_response: "Error de conexión con el servidor backend.",
        voice_response: "Hubo un error de conexión con el servidor.",
        visual_layout: {
          display_mode: "card",
          card_type: "error",
          title: "Error de Conexión",
          content_bullets: ["Asegúrese de que el backend FastAPI esté corriendo en el puerto 8000."],
          highlight_color: "#EF4444"
        },
        audio_chunks: []
      });
      setState('responding');
    }
    setQuestion('');
  };

  const handleMicClick = () => {
    if (state === 'standby' || state === 'responding') {
      setState('listening');
    } else if (state === 'listening') {
      setState('standby');
    }
  };

  return (
    <div className="w-full h-full bg-[#001E3C] rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-xl shadow-slate-200/50">
      <div className="absolute inset-0 bg-gradient-to-b from-[#002a54] to-[#001529] opacity-50"></div>

      <div className="relative z-10 flex flex-col h-full items-center text-center">

        {/* Top Bar with Manual Standby Button */}
        <div className="w-full flex justify-between items-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#004b7c]/50 border border-[#006bb3]/30 text-blue-300 text-xs font-bold tracking-wider uppercase">
            {state === 'standby' ? '🌙 Modo Espera' : '✨ Inteligencia Activa'}
          </div>

          {state !== 'standby' && (
            <button
              onClick={() => { setState('standby'); setResponseData(null); }}
              className="flex items-center gap-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 px-3 py-1.5 rounded-full border border-red-500/30 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <PowerOff className="w-3 h-3" />
              Forzar Espera
            </button>
          )}
        </div>

        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
          {title}
        </h2>

        <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed mb-6">
          {description}
        </p>

        {/* Dynamic State Area */}
        <div className="flex-1 flex flex-col w-full items-center justify-center min-h-[300px]">
          {state === 'standby' ? (
            <div className="flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity">
              <button
                onClick={handleMicClick}
                className="relative flex flex-col items-center justify-center w-32 h-32 rounded-full bg-slate-800/50 border-2 border-slate-600/50 hover:bg-blue-900/50 hover:border-blue-500/50 transition-all duration-300 mb-6"
              >
                <AudioLines className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                  Diga PharmaVox
                </span>
              </button>
            </div>
          ) : state === 'listening' ? (
            <div className="my-auto relative group flex flex-col items-center">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-[60px] transition-opacity duration-500 opacity-60 animate-pulse"></div>
              <button
                onClick={handleMicClick}
                className="relative flex flex-col items-center justify-center w-40 h-40 rounded-full bg-gradient-to-b from-[#004b7c] to-[#003152] border-4 border-[#005c99]/50 shadow-[0_0_40px_rgba(0,100,200,0.3)] scale-110 transition-all duration-300 mb-6"
              >
                <Mic className="w-12 h-12 text-white mb-2 animate-bounce" />
                <span className="text-xs font-bold text-white tracking-widest uppercase">
                  Escuchando...
                </span>
              </button>
              <div className="w-full mt-4">
                <AudioVisualizer />
              </div>
            </div>
          ) : state === 'processing' ? (
            <div className="flex flex-col items-center space-y-6">
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
              <p className="text-blue-400 font-medium tracking-widest text-sm animate-pulse uppercase">Analizando consulta...</p>
            </div>
          ) : state === 'responding' && responseData && (
            <div className="w-full text-left bg-white p-8 rounded-3xl shadow-2xl border-t-8 animate-fade-in" style={{ borderColor: responseData.visual_layout.highlight_color }}>
              <div className="flex items-center gap-4 mb-6">
                <BrainCircuit className="w-10 h-10" style={{ color: responseData.visual_layout.highlight_color }} />
                <h3 className="text-2xl font-extrabold text-slate-800">
                  {responseData.visual_layout.title}
                </h3>
              </div>

              <ul className="space-y-4 mb-8">
                {responseData.visual_layout.content_bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: responseData.visual_layout.highlight_color }}></div>
                    <span className="text-lg text-slate-600 font-medium leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-3 items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <Mic className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                <p className="text-sm text-slate-500 italic">
                  "{responseData.voice_response}"
                </p>
              </div>
              <p className="text-center text-xs text-slate-400 mt-4 font-bold tracking-widest uppercase">Volviendo a espera en 10s...</p>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="mt-auto w-full pt-6">
          <form onSubmit={handleSubmit} className="relative w-full">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Escriba su pregunta para interactuar..."
              disabled={state === 'processing' || state === 'standby'}
              className="w-full pl-6 pr-14 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/15 transition-all backdrop-blur-sm disabled:opacity-30"
            />
            <button
              type="submit"
              disabled={!question.trim() || state === 'processing' || state === 'standby'}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white disabled:opacity-50 disabled:bg-slate-600 hover:bg-blue-600 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
