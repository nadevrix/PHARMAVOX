import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Activity, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError('');
    try {
      const user = await api.login(loginEmail, loginPass);
      localStorage.setItem('user', JSON.stringify(user));
      
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/farmaceutico');
      }
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación. Verifique sus datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    executeLogin(email, password);
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
          <div className="flex items-center gap-4">
            <img src="/logo_final.jpg" alt="PharmaVox Logo" className="w-14 h-auto bg-white p-1.5 rounded-2xl object-contain shadow-[0_0_20px_rgba(255,255,255,0.15)] border border-white/20" />
            <div>
              <h1 className="text-3xl font-black text-white uppercase" style={{ letterSpacing: '-0.03em' }}>
                PHARMAVOX <span className="text-emerald-400 text-xl align-top">•</span>
              </h1>
              <p className="text-[10px] font-bold text-emerald-400/80 tracking-widest uppercase mt-0.5">CONTROL DE CALIDAD POR VOZ</p>
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

            {error && (
              <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
                <span>{error}</span>
              </div>
            )}

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
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-11 py-2.5 sm:text-sm border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                  <div 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer group"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#004b7c] hover:bg-[#00385e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Verificando...' : 'Ingresar al Sistema'}
                </button>
              </div>
            </form>


          </Card>
        </div>
      </div>
    </div>
  );
}
