import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Mic,
  BookOpen,
  LayoutList,
  Scan,
  LogOut
} from 'lucide-react';
import { VoiceAssistantPanel } from '../../components/ui/VoiceAssistantPanel';
import { ScannerPanel } from '../../components/ui/ScannerPanel';
import { SimplifierPanel } from '../../components/ui/SimplifierPanel';
import { SchedulerPanel } from '../../components/ui/SchedulerPanel';
import { PDFAssistantPanel } from '../../components/ui/PDFAssistantPanel';
import { api } from '../../services/api';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'voice' | 'scanner' | 'simplifier' | 'scheduler' | 'pdf-assistant'>('voice');
  const [isGeminiOk, setIsGeminiOk] = useState(false);
  const [healthChecking, setHealthChecking] = useState(true);

  // Healthcheck effect
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await api.healthCheck();
        setIsGeminiOk(data.status === 'healthy');
      } catch {
        setIsGeminiOk(false);
      } finally {
        setHealthChecking(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <img src="/logo_final.jpg" alt="PharmaVox Logo" className="w-14 h-auto object-contain mix-blend-multiply" />
            <div>
              <h1 className="text-2xl font-black text-[#00385F] tracking-tight uppercase" style={{ letterSpacing: '-0.03em' }}>
                PHARMAVOX <span className="text-blue-500 text-lg align-top">•</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Panel de Control de IA • Chávez S.A.</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          {/* Gemini Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            {healthChecking ? (
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
            ) : isGeminiOk ? (
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
            )}
            <span className="text-xs font-bold text-slate-500 tracking-wider">GEMINI API</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">Dra. Sofía Chávez</p>
            <p className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">Directora QA / Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#004b7c] text-white flex items-center justify-center font-bold shadow-md shadow-blue-900/20 border-2 border-white ring-2 ring-blue-100">
            S
          </div>
          <div className="w-px h-8 bg-slate-200 mx-2"></div>
          <Link to="/login" className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content — AI Control Center */}
      <main className="flex-1 flex justify-center p-4 sm:p-6 overflow-y-auto h-full w-full">

        {/* ═══ CENTER COLUMN: AI Tools (5 tabs) ═══ */}
        <div className="w-full max-w-5xl flex flex-col gap-6 min-h-[600px]">
          <div className="flex gap-1.5 shrink-0 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex-wrap">
            {([
              { key: 'voice', icon: Mic, label: 'Asistente de Voz', color: 'bg-[#004b7c]' },
              { key: 'scanner', icon: Scan, label: 'Escáner OCR', color: 'bg-blue-600' },
              { key: 'simplifier', icon: LayoutList, label: 'Simplificador', color: 'bg-indigo-600' },
              { key: 'scheduler', icon: Clock, label: 'Agenda Inteligente', color: 'bg-emerald-600' },
              { key: 'pdf-assistant', icon: BookOpen, label: 'Consulta RAG', color: 'bg-violet-600' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[120px] py-3.5 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all ${activeTab === tab.key ? `${tab.color} text-white shadow-md` : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-[500px] shadow-2xl rounded-[2rem] overflow-hidden">
            {activeTab === 'voice' && <VoiceAssistantPanel context="Admin" title="Voz de Administrador" description="Consulte índices de POE en tiempo real o el estado de la red." />}
            {activeTab === 'scanner' && <ScannerPanel />}
            {activeTab === 'simplifier' && <SimplifierPanel />}
            {activeTab === 'scheduler' && <SchedulerPanel />}
            {activeTab === 'pdf-assistant' && <PDFAssistantPanel />}
          </div>
        </div>
      </main>
    </div>
  );
}
