
import { Card } from '../../components/ui/Card';
import { Activity, BrainCircuit, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Consultas Card */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-bold text-sm tracking-wider uppercase">Consultas Hoy</h3>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-blue-700" />
            </div>
          </div>
          <div className="mt-auto">
            <span className="text-4xl font-extrabold text-slate-800">1,284</span>
            <div className="flex items-center mt-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              <span>+12% vs ayer</span>
            </div>
          </div>
        </Card>

        {/* % Acierto RAG */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-bold text-sm tracking-wider uppercase">Precisión RAG</h3>
            <div className="bg-emerald-100 p-2 rounded-lg">
              <BrainCircuit className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-auto">
            <span className="text-4xl font-extrabold text-slate-800">99.8%</span>
            <div className="flex items-center mt-2 text-slate-500 text-sm font-medium">
              <span>Basado en 5,000 interacciones</span>
            </div>
          </div>
        </Card>

        {/* Alertas */}
        <Card className="flex flex-col border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-bold text-sm tracking-wider uppercase">Alertas Activas</h3>
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="mt-auto">
            <span className="text-4xl font-extrabold text-slate-800">2</span>
            <div className="flex items-center mt-2 text-red-600 text-sm font-medium">
              <span>Requieren revisión QA</span>
            </div>
          </div>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[300px]">
          <h3 className="text-slate-800 font-bold text-lg mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Consulta de POE-Limpieza</p>
                    <p className="text-xs text-slate-500">Operario Carlos Mendoza</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">Hace {i * 15} min</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="min-h-[300px] bg-gradient-to-br from-blue-700 to-blue-900 text-white border-0">
           <h3 className="text-blue-100 font-bold text-lg mb-4">Estado del Sistema FarmaCopilot</h3>
           <div className="mt-8">
             <div className="flex items-center space-x-4 mb-6">
               <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                 <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
               </div>
               <div>
                 <p className="font-bold text-xl">Línea en Vivo</p>
                 <p className="text-blue-200 text-sm">Escuchando en 4 laboratorios</p>
               </div>
             </div>
             <p className="text-blue-100/80 leading-relaxed text-sm">
               El modelo de lenguaje y el sistema RAG están operando de forma óptima. Latencia promedio de respuesta: 1.2s. Base de datos vectorial sincronizada.
             </p>
           </div>
        </Card>
      </div>
    </div>
  );
}
