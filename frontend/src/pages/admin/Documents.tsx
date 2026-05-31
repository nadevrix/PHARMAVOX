import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { UploadCloud, File, Trash2, RefreshCw } from 'lucide-react';

export function Documents() {
  const [docs] = useState([
    { id: 1, name: 'POE-Amoxicilina v2.1', batch: 'L-AMX-402', date: '2026-05-28', status: 'Activo' },
    { id: 2, name: 'POE-Ibuprofeno v1.4', batch: 'L-IBU-109', date: '2026-05-20', status: 'Activo' },
    { id: 3, name: 'POE-Paracetamol v3.0', batch: 'L-PAR-301', date: '2026-04-15', status: 'Obsoleto' },
    { id: 4, name: 'POE-Limpieza de Reactores v1.1', batch: '-', date: '2026-05-29', status: 'Activo' },
  ]);

  const columns = [
    {
      header: 'Nombre del Manual',
      accessor: (row: any) => (
        <div className="flex items-center space-x-3">
          <div className="bg-blue-50 p-2 rounded-lg">
            <File className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-bold text-slate-800">{row.name}</span>
        </div>
      )
    },
    { header: 'Lote', accessor: 'batch' as keyof any },
    { header: 'Fecha de Subida', accessor: 'date' as keyof any },
    {
      header: 'Estado',
      accessor: (row: any) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
          {row.status.toUpperCase()}
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: () => (
        <div className="flex items-center space-x-2">
          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Reemplazar">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Documentos POE</h2>
          <p className="text-sm text-slate-500 mt-1">Sube y gestiona los PDFs que alimentan al sistema RAG.</p>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center py-12 cursor-pointer hover:bg-blue-50 transition-colors">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          <UploadCloud className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-slate-800 font-bold mb-1">Haz clic para subir o arrastra los PDFs aquí</p>
        <p className="text-slate-500 text-sm">Formatos soportados: PDF, DOCX (Máx 50MB)</p>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Manuales en Base Vectorial</h3>
        </div>
        <DataTable<any> data={docs} columns={columns} />
      </Card>
    </div>
  );
}
