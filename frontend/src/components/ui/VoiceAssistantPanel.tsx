import { useState, useEffect, useRef } from 'react';
import { Mic, BrainCircuit, Send, Loader2, PowerOff, AudioLines, Play } from 'lucide-react';
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
  title = "Asistente de Voz FarmaVox",
  description = "Activa el modo IA y di 'PharmaVox' para iniciar una consulta clínica hands-free."
}: VoiceAssistantPanelProps) {
  // Session States
  const [isInIaMode, setIsInIaMode] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(1800); // 30 mins in seconds
  
  // Microphone & Speech States
  const [state, setState] = useState<'inactive' | 'standby' | 'listening' | 'processing' | 'responding' | 'error'>('inactive');
  const [question, setQuestion] = useState('');
  const [responseData, setResponseData] = useState<AskResponse | null>(null);
  
  // SpeechRecognition References
  const wakeWordRecognitionRef = useRef<any>(null);
  const questionRecognitionRef = useRef<any>(null);
  const responseTimerRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // ── 1. SESSION TIMER (30 Minutos) ──
  useEffect(() => {
    if (!isInIaMode) {
      setSessionTimeLeft(1800);
      return;
    }

    const timer = setInterval(() => {
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          handleExitIaMode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isInIaMode]);

  // Format session time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── 2. WAKE WORD DETECTION (Escucha Pasiva) ──
  useEffect(() => {
    if (!isInIaMode || state !== 'standby') {
      stopWakeWordRecognition();
      return;
    }

    startWakeWordRecognition();

    return () => {
      stopWakeWordRecognition();
    };
  }, [isInIaMode, state]);

  const startWakeWordRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Browser speech recognition not supported.');
      return;
    }

    if (wakeWordRecognitionRef.current) {
      try { wakeWordRecognitionRef.current.stop(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {};

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.toLowerCase().trim();
      
      const wakeWords = ['pharmavox', 'farma vox', 'farma box', 'farmavox', 'farma box', 'farma bos', 'farma vox', 'farma vos'];
      const hit = wakeWords.some(word => transcript.includes(word));

      if (hit) {
        // Reproducir sonido sutil de activación
        playBeep();
        setState('listening');
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        console.error('WakeWord recognition error:', e);
      }
    };

    recognition.onend = () => {
      // Reiniciar si seguimos en standby
      if (isInIaMode && state === 'standby') {
        try { recognition.start(); } catch {}
      }
    };

    wakeWordRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}
  };

  const stopWakeWordRecognition = () => {
    if (wakeWordRecognitionRef.current) {
      try { wakeWordRecognitionRef.current.stop(); } catch {}
      wakeWordRecognitionRef.current = null;
    }
  };

  // ── 3. CAPTURA DE PREGUNTA EN MODO LISTENING ──
  useEffect(() => {
    if (state !== 'listening') {
      if (questionRecognitionRef.current) {
        try { questionRecognitionRef.current.stop(); } catch {}
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        handleSubmitText(transcript);
      }
    };

    recognition.onerror = (e: any) => {
      console.error('Question recognition error:', e);
      setState('standby');
    };

    recognition.onend = () => {
      // Si terminó sin capturar nada, volver a standby después de un breve momento
      if (state === 'listening') {
        setState('standby');
      }
    };

    questionRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}

    // Temporizador de 10 segundos por si no habla
    const idleTimer = setTimeout(() => {
      if (state === 'listening') {
        setState('standby');
      }
    }, 10000);

    return () => {
      clearTimeout(idleTimer);
      try { recognition.stop(); } catch {}
    };
  }, [state]);

  // ── 4. AUTO-STANDBY DESPUÉS DE LA RESPUESTA (10 Segundos) ──
  useEffect(() => {
    if (state === 'responding') {
      responseTimerRef.current = setTimeout(() => {
        setState('standby');
        setResponseData(null);
      }, 10000);
    }

    return () => {
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
      }
    };
  }, [state]);

  // ── 5. PROCESAR CONSULTA ──
  const handleSubmitText = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Detener cualquier audio previo
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    setState('processing');
    setResponseData(null);

    try {
      const data = await api.askAssistant(queryText, context);
      setResponseData(data);
      setState('responding');

      // Reproducir audio Base64 si está presente
      if (data.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
        currentAudioRef.current = audio;
        audio.play();
      }
    } catch (error) {
      console.error(error);
      setResponseData({
        text_response: "Error de comunicación con el backend.",
        voice_response: "Error de comunicación con el servidor.",
        visual_layout: {
          display_mode: "card",
          card_type: "error",
          title: "Error de Conexión",
          content_bullets: ["El backend no está respondiendo. Inténtelo de nuevo."],
          highlight_color: "#EF4444"
        },
        audio_chunks: []
      });
      setState('responding');
    }
  };

  const handleEnterIaMode = () => {
    setIsInIaMode(true);
    setState('standby');
  };

  const handleExitIaMode = () => {
    setIsInIaMode(false);
    setState('inactive');
    setResponseData(null);
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    stopWakeWordRecognition();
  };

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  };

  return (
    <div className="w-full h-full bg-[#001E3C] rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-xl shadow-slate-200/50">
      <div className="absolute inset-0 bg-gradient-to-b from-[#002a54] to-[#001529] opacity-50"></div>

      <div className="relative z-10 flex flex-col h-full items-center text-center justify-between">
        
        {/* Top Info Bar */}
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              state === 'inactive' ? 'bg-slate-700 text-slate-300' :
              state === 'standby' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
            }`}>
              {state === 'inactive' && '🌙 MODO INACTIVO'}
              {state === 'standby' && '✨ WAKE WORD ACTIVO'}
              {state === 'listening' && '🎙️ ESCUCHANDO CONSULTA'}
              {state === 'processing' && '🧠 PROCESANDO CON IA'}
              {state === 'responding' && '🔊 TRANSMITIENDO RESPUESTA'}
            </span>
          </div>

          {isInIaMode && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">SESIÓN ACTIVADA</span>
                <span className="text-sm font-black text-white tracking-wider">{formatTime(sessionTimeLeft)}</span>
              </div>
              <button
                onClick={handleExitIaMode}
                className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider shadow-md"
              >
                <PowerOff className="w-3.5 h-3.5" />
                Salir Modo IA
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Center Panel */}
        <div className="flex-1 flex flex-col w-full items-center justify-center min-h-[350px]">
          {state === 'inactive' ? (
            <div className="flex flex-col items-center max-w-md animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-[#004b7c]/10 border border-[#004b7c]/30 flex items-center justify-center mb-6 shadow-2xl">
                <BrainCircuit className="w-12 h-12 text-blue-400" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{title}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-8 leading-relaxed">
                {description}
              </p>
              <button
                onClick={handleEnterIaMode}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl transition-all flex items-center gap-2 transform hover:scale-105"
              >
                <Play className="w-4 h-4 fill-white" /> ENTRAR A MODO IA
              </button>
            </div>
          ) : state === 'standby' ? (
            <div className="flex flex-col items-center animate-fade-in">
              <button
                onClick={() => setState('listening')}
                className="relative flex flex-col items-center justify-center w-36 h-36 rounded-full bg-slate-800/40 border-2 border-slate-700/50 shadow-2xl mb-6 cursor-pointer hover:bg-slate-800/60 transition-all hover:scale-105 active:scale-95"
                title="Presione para hablar manualmente"
              >
                <AudioLines className="w-12 h-12 text-slate-400 mb-2 animate-pulse" />
                <span className="text-[9px] font-black text-blue-400 tracking-widest uppercase animate-pulse">
                  PRESIONE PARA HABLAR
                </span>
              </button>
              <p className="text-white text-sm font-medium">
                Diga <span className="text-blue-400 font-extrabold">"PharmaVox"</span> para activar el micrófono.
              </p>
              {!(window as any).SpeechRecognition && !(window as any).webkitSpeechRecognition ? (
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-xs leading-normal">
                  ⚠️ Control de voz automático no disponible en este navegador. Presione el botón de arriba o escriba su consulta abajo.
                </p>
              ) : (
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  o cualquier palabra similar
                </p>
              )}
            </div>
          ) : state === 'listening' ? (
            <div className="relative flex flex-col items-center animate-fade-in w-full">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-[70px] opacity-40 animate-pulse"></div>
              <button
                onClick={() => setState('standby')}
                className="relative flex flex-col items-center justify-center w-40 h-40 rounded-full bg-gradient-to-b from-[#004b7c] to-[#003152] border-4 border-blue-400 shadow-[0_0_50px_rgba(59,130,246,0.5)] mb-6 cursor-pointer hover:scale-105 transition-transform"
                title="Presione para detener"
              >
                <Mic className="w-14 h-14 text-white mb-2 animate-bounce" />
                <span className="text-[10px] font-black text-blue-300 tracking-widest uppercase">
                  DETENER ESCUCHA
                </span>
              </button>
              <p className="text-white font-bold text-sm">Hable ahora...</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                FarmaVox se detendrá si detecta 10 segundos de silencio.
              </p>
              <div className="w-full max-w-sm mt-4">
                <AudioVisualizer />
              </div>
            </div>
          ) : state === 'processing' ? (
            <div className="flex flex-col items-center space-y-6">
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
              <p className="text-blue-400 font-black tracking-widest text-xs animate-pulse uppercase">Analizando Consulta Clínica...</p>
            </div>
          ) : state === 'responding' && responseData ? (
            <div className="w-full text-left bg-white p-8 rounded-[2.5rem] shadow-2xl border-t-8 animate-fade-in" style={{ borderColor: responseData.visual_layout.highlight_color }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <BrainCircuit className="w-8 h-8" style={{ color: responseData.visual_layout.highlight_color }} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">
                    {responseData.visual_layout.title}
                  </h3>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">LECTURA DE BASE CLÍNICA</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {responseData.visual_layout.content_bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: responseData.visual_layout.highlight_color }}></div>
                    <span className="text-slate-600 font-medium leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-3 items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                <Mic className="w-5 h-5 text-slate-400 flex-shrink-0 ml-1" />
                <p className="text-xs font-bold text-slate-500 italic">
                  "{responseData.voice_response}"
                </p>
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-6 font-black tracking-widest uppercase">Regresando a Escucha Pasiva en 10s...</p>
            </div>
          ) : null}
        </div>

        {/* Input Bar (Only visible when active in IA Mode and not listening/processing) */}
        {isInIaMode && (state === 'standby' || state === 'responding') && (
          <div className="mt-auto w-full pt-6">
            <div className="relative w-full">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Escriba su consulta médica o diga 'PharmaVox'..."
                className="w-full pl-6 pr-14 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/15 transition-all backdrop-blur-sm text-sm"
              />
              <button
                onClick={() => {
                  if (question.trim()) {
                    handleSubmitText(question);
                    setQuestion('');
                  }
                }}
                disabled={!question.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white disabled:opacity-50 disabled:bg-slate-600 hover:bg-blue-600 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
