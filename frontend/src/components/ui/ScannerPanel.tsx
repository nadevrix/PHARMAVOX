import { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, Loader2, Pill } from 'lucide-react';
import { api, type ScanResponse } from '../../services/api';

export function ScannerPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError('');
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setIsScanning(true);
    setError('');
    
    try {
      const data = await api.scanMedication(file);
      setResult(data);
    } catch (err) {
      setError('Error al conectar con el motor de escaneo. Verifique el backend.');
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-wider mb-2 uppercase">
            📷 Visión Artificial
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Escáner de Medicamentos</h2>
        </div>
      </div>

      {!result ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          {preview ? (
             <div className="flex flex-col items-center w-full max-w-sm">
                <div className="w-full h-48 rounded-2xl border-4 border-slate-100 overflow-hidden mb-6 relative">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  {isScanning && (
                    <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Loader2 className="w-10 h-10 text-white animate-spin mb-2" />
                      <span className="text-white font-bold text-sm tracking-wider uppercase">Analizando...</span>
                    </div>
                  )}
                </div>
                
                {!isScanning && (
                  <div className="flex gap-4 w-full">
                    <button 
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleScan}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                    >
                      Procesar Imagen
                    </button>
                  </div>
                )}
             </div>
          ) : (
            <label className="w-full max-w-sm h-64 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all cursor-pointer flex flex-col items-center justify-center group">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-blue-500" />
              </div>
              <span className="font-bold text-slate-600 text-lg mb-1">Subir Imagen</span>
              <span className="text-sm text-slate-400 px-8 text-center">Caja, receta o prospecto fotográfico</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium w-full max-w-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto animate-fade-in pr-2">
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-center gap-4 mb-6 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
            <div>
              <h4 className="font-bold">Análisis Completado</h4>
              <p className="text-sm opacity-90">Extracción estructurada con Gemini 1.5</p>
            </div>
            <button 
              onClick={() => { setResult(null); setFile(null); setPreview(null); }}
              className="ml-auto text-sm font-bold bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
            >
              Nuevo Escaneo
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 mb-1">
                <Pill className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Medicamento</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{result.medication.name}</p>
              <p className="text-sm text-slate-500 mt-1">{result.medication.active_ingredient} • {result.medication.concentration}</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Presentación</span>
              <p className="font-semibold text-slate-700">{result.medication.presentation}</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Fabricante</span>
              <p className="font-semibold text-slate-700">{result.medication.manufacturer || 'Desconocido'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" /> Resumen Rápido
              </h4>
              <p className="text-sm text-slate-600 bg-blue-50/50 p-4 rounded-xl border border-blue-50 leading-relaxed">
                {result.quick_summary}
              </p>
            </div>

            {result.critical_warnings.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Advertencias Críticas
                </h4>
                <ul className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-2">
                  {result.critical_warnings.map((warn, i) => (
                    <li key={i} className="text-sm text-red-700 font-medium flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                      {warn}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
