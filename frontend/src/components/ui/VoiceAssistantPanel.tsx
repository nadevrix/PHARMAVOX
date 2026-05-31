import { useState, useEffect, useRef } from 'react';
import { Mic, BrainCircuit, Send, Loader2, PowerOff, AudioLines, Play, X, AlertTriangle } from 'lucide-react';
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
  description = "Activa el modo IA y di 'PharmaVox' para iniciar una consulta clínica."
}: VoiceAssistantPanelProps) {
  // Session States
  const [isInIaMode, setIsInIaMode] = useState(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(1800); // 30 mins in seconds
  
  // Microphone & Speech States
  // States:
  // - 'inactive' (off)
  // - 'standby' (blue / durmiendo / waiting for "PharmaVox")
  // - 'listening' (yellow / esperando / capturing question)
  // - 'processing' / 'responding' (green / en funcionamiento / thinking or speaking)
  // - 'error' (red / falla o sin tokens)
  const [state, setState] = useState<'inactive' | 'standby' | 'listening' | 'processing' | 'responding' | 'error'>('standby');
  const [question, setQuestion] = useState('');
  const [responseData, setResponseData] = useState<AskResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  
  // SpeechRecognition References
  const wakeWordRecognitionRef = useRef<any>(null);
  const questionRecognitionRef = useRef<any>(null);
  const responseTimerRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const hasSpokenRef = useRef<boolean>(false);

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
      
      const wakeWords = ['pharmavox', 'farma vox', 'farma box', 'farmavox', 'farma box', 'farma bos', 'farma vox', 'farma vos', 'hola farma', 'farma'];
      const hit = wakeWords.some(word => transcript.includes(word));

      if (hit) {
        playBeep();
        // Hablar un saludo rápido confirmando que se despertó, luego ir a escuchar
        handleWakeupGreeting();
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        console.error('WakeWord recognition error:', e);
      }
    };

    recognition.onend = () => {
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

  // ── 3. CAPTURA DE PREGUNTA EN MODO LISTENING (Silencio de 10s Máximo) ──
  useEffect(() => {
    if (state !== 'listening') {
      if (questionRecognitionRef.current) {
        try { questionRecognitionRef.current.stop(); } catch {}
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;
    hasSpokenRef.current = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        hasSpokenRef.current = true;
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        handleSubmitText(transcript);
      }
    };

    recognition.onerror = (e: any) => {
      console.error('Question recognition error:', e);
      if (!hasSpokenRef.current) {
        playSleepBeep();
        setState('standby');
      }
    };

    recognition.onend = () => {
      // Si el navegador detiene la escucha por silencio local del motor pero aún no se han cumplido los 10 segundos,
      // la reiniciamos para no cortar al operario.
      if (state === 'listening' && !hasSpokenRef.current) {
        try {
          recognition.start();
        } catch {}
      }
    };

    questionRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}

    // Iniciar temporizador estricto de 10 segundos de inactividad
    silenceTimerRef.current = setTimeout(() => {
      if (state === 'listening' && !hasSpokenRef.current) {
        playSleepBeep();
        setState('standby');
      }
    }, 10000);

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
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

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    setState('processing');
    setResponseData(null);

    const updatedHistory = [...chatHistory, `Usuario: ${queryText}`];
    setChatHistory(updatedHistory);

    try {
      const data = await api.askAssistant(queryText, context, updatedHistory);
      setResponseData(data);
      setState('responding');

      setChatHistory([...updatedHistory, `Asistente: ${data.text_response}`]);

      if (data.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
        currentAudioRef.current = audio;
        audio.play();
      }
    } catch (error) {
      console.error(error);
      setState('error');
      setResponseData({
        text_response: "Falla de comunicación o límite de cuota/tokens agotado.",
        voice_response: "Falla de comunicación o límite de cuota/tokens agotado en la API de Gemini.",
        visual_layout: {
          display_mode: "card",
          card_type: "error",
          title: "Falla / Sin Tokens",
          content_bullets: [
            "La API de Gemini ha reportado agotamiento de tokens o error de red.",
            "Compruebe su cuota o intente nuevamente más tarde."
          ],
          highlight_color: "#EF4444"
        },
        audio_chunks: []
      });
    }
  };

  // Saludo cuando se detecta el wake word "PharmaVox"
  const handleWakeupGreeting = async () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    setState('processing');
    setResponseData(null);

    try {
      // Solicitar al backend un saludo de activación cortísimo
      const data = await api.askAssistant("saludo corto de confirmación de escucha de 2 a 3 palabras para operario", context, []);
      setResponseData(data);
      setState('responding');

      if (data.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
        currentAudioRef.current = audio;
        audio.play();
        audio.onended = () => {
          setState('listening');
        };
      } else {
        setTimeout(() => {
          setState('listening');
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      setState('listening');
    }
  };

  const handleEnterIaMode = async () => {
    setIsInIaMode(true);
    setState('processing');
    setChatHistory([]);
    playBeep();

    try {
      const data = await api.askAssistant("hola", context, []);
      setResponseData(data);
      setState('responding');
      setChatHistory([`Asistente: ${data.text_response}`]);

      if (data.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
        currentAudioRef.current = audio;
        audio.play();
      }
    } catch (error) {
      console.error(error);
      setState('standby');
    }
  };

  const handleExitIaMode = () => {
    setIsInIaMode(false);
    setState('inactive');
    setResponseData(null);
    setChatHistory([]);
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

  const playSleepBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  return (
    <div className="w-full h-full bg-[#001E3C] rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-xl shadow-slate-200/50">
      <div className="absolute inset-0 bg-gradient-to-b from-[#002a54] to-[#001529] opacity-50"></div>

      <div className="relative z-10 flex flex-col h-full items-center text-center justify-between">
        
        {/* Top Info Bar with the glowing custom requested colors */}
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-slate-900/60 shadow-lg ${
              state === 'inactive' ? 'text-slate-400 border-slate-700' :
              state === 'standby' ? 'text-blue-400 border-blue-500/30' :
              state === 'listening' ? 'text-yellow-400 border-yellow-500/30' :
              state === 'error' ? 'text-rose-400 border-rose-500/30 animate-pulse' :
              'text-emerald-400 border-emerald-500/30 animate-pulse'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                state === 'inactive' ? 'bg-slate-500' :
                state === 'standby' ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-pulse' :
                state === 'listening' ? 'bg-yellow-500 shadow-[0_0_12px_#eab308] animate-ping' :
                state === 'error' ? 'bg-rose-500 shadow-[0_0_10px_#ef4444]' :
                'bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse'
              }`}></span>
              {state === 'inactive' && '🌙 MODO INACTIVO'}
              {state === 'standby' && '💤 DURMIENDO'}
              {state === 'listening' && '👂 ESPERANDO PREGUNTA'}
              {state === 'processing' && '🧠 EN FUNCIONAMIENTO'}
              {state === 'responding' && '🔊 EN FUNCIONAMIENTO'}
              {state === 'error' && '🔴 FALLA EN SISTEMA / SIN TOKENS'}
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
                Salir
              </button>
            </div>
          )}
        </div>

        {/* Center Main Stage */}
        <div className="flex-1 flex items-center justify-center w-full my-4">
          {state === 'inactive' ? (
            <div className="flex flex-col items-center max-w-sm">
              <div className="relative flex items-center justify-center w-36 h-36 rounded-full bg-slate-800/40 border border-slate-700/50 shadow-2xl mb-6">
                <Mic className="w-12 h-12 text-slate-500" />
              </div>
              <h3 className="text-white font-extrabold text-lg uppercase tracking-wider mb-2">MODO MANOS LIBRES</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                {description}
              </p>
              <button
                onClick={handleEnterIaMode}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" /> ENTRAR A MODO IA
              </button>
            </div>
          ) : state === 'standby' ? (
            <div className="flex flex-col items-center animate-fade-in">
              <button
                onClick={() => setState('listening')}
                className="relative flex flex-col items-center justify-center w-36 h-36 rounded-full bg-blue-950/40 border-2 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.2)] mb-6 cursor-pointer hover:bg-blue-900/40 transition-all hover:scale-105 active:scale-95"
                title="Presione para hablar manualmente"
              >
                <AudioLines className="w-12 h-12 text-blue-400 mb-2 animate-pulse" />
                <span className="text-[9px] font-black text-blue-400 tracking-widest uppercase animate-pulse">
                  DURMIENDO
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
              <div className="absolute inset-0 bg-yellow-500 rounded-full blur-[70px] opacity-20 animate-pulse"></div>
              <button
                onClick={() => setState('standby')}
                className="relative flex flex-col items-center justify-center w-40 h-40 rounded-full bg-gradient-to-b from-[#4d3e00] to-[#261f00] border-4 border-yellow-400 shadow-[0_0_50px_rgba(234,179,8,0.4)] mb-6 cursor-pointer hover:scale-105 transition-transform animate-pulse"
                title="Presione para detener"
              >
                <Mic className="w-14 h-14 text-yellow-300 mb-2 animate-bounce" />
                <span className="text-[10px] font-black text-yellow-300 tracking-widest uppercase">
                  ESCUCHANDO
                </span>
              </button>
              <p className="text-white font-bold text-sm">Hable ahora...</p>
              <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                FarmaVox regresará a espera tras 10 segundos de silencio.
              </p>
              <div className="w-full max-w-sm mt-4">
                <AudioVisualizer />
              </div>
            </div>
          ) : state === 'processing' ? (
            <div className="flex flex-col items-center space-y-6">
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-emerald-950/40 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              </div>
              <p className="text-emerald-400 font-black tracking-widest text-xs animate-pulse uppercase">EN FUNCIONAMIENTO / PROCESANDO...</p>
            </div>
          ) : state === 'error' && responseData ? (
            <div className="w-full text-left bg-white p-8 rounded-[2.5rem] shadow-2xl border-t-8 animate-fade-in border-rose-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">
                    {responseData.visual_layout.title}
                  </h3>
                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mt-0.5">FALLA EN LA LLAMADA</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {responseData.visual_layout.content_bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 bg-rose-500"></div>
                    <span className="text-slate-600 font-medium leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setState('standby')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-colors text-center"
              >
                Volver a Escucha Pasiva (Durmiendo)
              </button>
            </div>
          ) : state === 'responding' && responseData ? (
            <div className="w-full text-left bg-white p-8 rounded-[2.5rem] shadow-2xl border-t-8 animate-fade-in border-emerald-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <BrainCircuit className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">
                    {responseData.visual_layout.title}
                  </h3>
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mt-0.5">EN FUNCIONAMIENTO / AUDIO DE RETORNO</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {responseData.visual_layout.content_bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 bg-emerald-500"></div>
                    <span className="text-slate-600 font-medium leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-3 items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
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
        {isInIaMode && (state === 'standby' || state === 'responding' || state === 'error') && (
          <div className="mt-auto w-full pt-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Escriba su consulta clínica manual aquí..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmitText(question);
                    setQuestion('');
                  }
                }}
                className="w-full bg-[#001429] border border-slate-700/50 rounded-2xl px-6 py-4 text-white placeholder:text-slate-500 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-[#000F1F] pr-16 transition-all"
              />
              <button
                onClick={() => {
                  handleSubmitText(question);
                  setQuestion('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
