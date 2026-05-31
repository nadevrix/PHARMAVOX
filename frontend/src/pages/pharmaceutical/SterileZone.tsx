import { useState } from 'react';
import { LogOut, Mic, BrainCircuit, Scan, LayoutList, Clock, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VoiceAssistantPanel } from '../../components/ui/VoiceAssistantPanel';
import { ScannerPanel } from '../../components/ui/ScannerPanel';
import { SimplifierPanel } from '../../components/ui/SimplifierPanel';
import { SchedulerPanel } from '../../components/ui/SchedulerPanel';
import { PDFAssistantPanel } from '../../components/ui/PDFAssistantPanel';

export function SterileZone() {
  const [activeTab, setActiveTab] = useState<'voice' | 'scanner' | 'simplifier' | 'scheduler' | 'pdf-assistant'>('voice');

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shrink-0">
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
            {activeTab === 'voice' && <VoiceAssistantPanel context="Operario" />}
            {activeTab === 'scanner' && <ScannerPanel />}
            {activeTab === 'simplifier' && <SimplifierPanel />}
            {activeTab === 'scheduler' && <SchedulerPanel />}
            {activeTab === 'pdf-assistant' && <PDFAssistantPanel />}
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase bg-slate-50 shrink-0">
        PharmaVox © 2026 • Plataforma de Seguridad Farmacológica • Chávez S.A.
      </footer>
    </div>
  );
}
