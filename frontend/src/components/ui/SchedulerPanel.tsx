import { useState } from 'react';
import { Clock, Calendar, Volume2, Loader2, Bell, CheckCircle } from 'lucide-react';
import { api, type ScheduleResponse } from '../../services/api';

export function SchedulerPanel() {
  const [medication, setMedication] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScheduleResponse | null>(null);
  const [error, setError] = useState('');

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medication.trim() || !instructions.trim()) return;
    setIsProcessing(true);
    setError('');
    
    try {
      const data = await api.scheduleDosage(medication, instructions);
      setResult(data);
    } catch (err) {
      setError('Error al generar la agenda. Verifique la conexión con el backend.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-200">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold tracking-wider mb-2 uppercase">
            ⏰ Planificación Inteligente
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Planificador de Dosis</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {!result ? (
          <form onSubmit={handleSchedule} className="flex flex-col h-full space-y-5">
            <p className="text-sm text-slate-500 mb-2 shrink-0">
              Genere una agenda automatizada de tomas y alarmas basadas en las instrucciones médicas.
            </p>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Medicamento</label>
              <input 
                type="text" 
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                placeholder="Ej. Amoxicilina 500mg"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-bold text-slate-700 mb-2">Instrucciones (Extraídas del POE o Receta)</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ej. Tomar 1 cápsula cada 8 horas por 7 días..."
                className="w-full flex-1 min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                required
              />
            </div>
            
            {error && <p className="text-red-500 text-sm font-medium shrink-0">{error}</p>}
            
            <button
              type="submit"
              disabled={!medication.trim() || !instructions.trim() || isProcessing}
              className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-2 shrink-0"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Procesando Plan...</>
              ) : (
                <><Calendar className="w-5 h-5" /> Generar Agenda</>
              )}
            </button>
          </form>
        ) : (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Plan de Tomas: {result.schedule_plan.medication_name}</h3>
                  <p className="text-sm text-slate-500">Duración: {result.schedule_plan.duration_days} días • Cada {result.schedule_plan.interval_hours} horas</p>
                </div>
              </div>
              <button 
                onClick={() => setResult(null)}
                className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition-colors bg-emerald-50 px-4 py-2 rounded-lg"
              >
                Nuevo Plan
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <div className="relative border-l-2 border-emerald-100 ml-4 space-y-8 pb-4">
                {result.schedule_plan.reminders.map((reminder, idx) => (
                  <div key={idx} className="relative pl-8">
                    {/* Timeline dot */}
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
                    
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg">
                          <Clock className="w-4 h-4" />
                          {reminder.time}
                        </div>
                        <Bell className="w-4 h-4 text-slate-300" />
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-3 items-center">
                        <Volume2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <p className="text-sm text-slate-600 font-medium italic">
                          "{reminder.voice_reminder_text}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
