
import { Mic } from 'lucide-react';

export function AudioVisualizer() {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Ripple effects */}
      <div className="absolute w-full h-full bg-blue-500 rounded-full opacity-20 animate-ping" style={{ animationDuration: '3s' }}></div>
      <div className="absolute w-4/5 h-4/5 bg-emerald-400 rounded-full opacity-30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
      <div className="absolute w-3/5 h-3/5 bg-blue-600 rounded-full opacity-40 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '1s' }}></div>
      
      {/* Central Mic Button */}
      <div className="relative z-10 flex flex-col items-center justify-center w-32 h-32 bg-blue-700 rounded-full shadow-lg shadow-blue-500/50">
        <Mic className="w-12 h-12 text-white mb-1" />
        <span className="text-[10px] font-bold text-blue-100 tracking-wider">INGRESAR IA</span>
      </div>
    </div>
  );
}
