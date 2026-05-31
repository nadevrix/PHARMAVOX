import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, Activity, BrainCircuit } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('admin') || email.includes('qa') || email.includes('chavez')) {
      navigate('/admin/dashboard');
    } else {
      navigate('/farmaceutico');
    }
  };

  const loginAs = (roleEmail: string) => {
    setEmail(roleEmail);
    if (roleEmail.includes('chavez') || roleEmail.includes('admin') || roleEmail.includes('qa')) {
      navigate('/admin/dashboard');
    } else {
      navigate('/farmaceutico');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 flex-col p-12 overflow-hidden">
        {/* Background gradient/glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 shadow-sm">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">PharmaVox</h1>
              <p className="text-[10px] font-bold text-emerald-400 tracking-wider">CONTROL DE CALIDAD POR VOZ</p>
            </div>
          </div>

          {/* Center Content */}
          <div className="flex-1 flex flex-col justify-center max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 w-fit mb-6 shadow-inner">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">RAG Integrado para Farmacia y Manufactura</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-[1.15] mb-6 tracking-tight">
              Garantías de Seguridad y Acceso Regulado de POEs
            </h2>
            
            <p className="text-slate-300 text-lg leading-relaxed">
              Plataforma asistida por voz que autoriza la consulta y auditoría de Procedimientos Operativos Estándares (POE) en tiempo real para laboratorios estériles y control de producción.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-auto text-sm text-slate-500 font-medium">
            © 2026 PharmaVox S.A. • Grupo Farmacorp & Chávez SRL
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 p-6 sm:p-12 relative">
        <div className="w-full max-w-[480px]">
          <Card className="p-8 sm:p-10 shadow-xl shadow-slate-200/50 border-white/80 bg-white/80 backdrop-blur-xl">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Acceso Integrado</h3>
              <p className="text-slate-500 mt-2 text-sm">
                Introduzca sus credenciales habilitadas para iniciar operaciones.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Correo Farmacéutico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-3 py-2.5 sm:text-sm border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors placeholder:text-slate-400"
                    placeholder="usuario@farmacorp.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Contraseña de Firma Digital
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-11 pr-11 py-2.5 sm:text-sm border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer group">
                    <Eye className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#004b7c] hover:bg-[#00385e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all"
                >
                  Ingresar al Sistema
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-400 text-[11px] tracking-widest font-bold uppercase">
                    Acceso de prueba rápido
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => loginAs('carlos.mendoza@farmacorp.com')}
                  className="w-full flex justify-between items-center p-3 sm:px-4 border border-slate-200 rounded-xl shadow-sm bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 group-hover:text-[#004b7c] transition-colors">Carlos Mendoza</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">carlos.mendoza@farmacorp.com</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded uppercase tracking-wider">Operario</span>
                </button>

                <button
                  onClick={() => loginAs('ana.gomez@farmacorp.com')}
                  className="w-full flex justify-between items-center p-3 sm:px-4 border border-slate-200 rounded-xl shadow-sm bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 group-hover:text-[#004b7c] transition-colors">Ana Gómez</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">ana.gomez@farmacorp.com</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded uppercase tracking-wider">Operario</span>
                </button>
                
                <button
                  onClick={() => loginAs('sofia.chavez@farmacorp.com')}
                  className="w-full flex justify-between items-center p-3 sm:px-4 border border-slate-200 rounded-xl shadow-sm bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#004b7c]"></div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 group-hover:text-[#004b7c] transition-colors">Dra. Sofía Chávez</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">sofia.chavez@farmacorp.com</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#004b7c] bg-blue-50 border border-blue-100 px-2 py-1 rounded uppercase tracking-wider">QA / Admin</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
