import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';

export function History() {
  const [history] = useState([
    {
      id: 1,
      operator: 'Carlos Mendoza',
      question: '¿Cuál es la temperatura máxima para el reactor 3?',
      answer: 'La temperatura máxima es 85°C.',
      document: 'POE-Limpieza de Reactores v1.1',
      datetime: '2026-05-30 08:15:22'
    },
    {
      id: 2,
      operator: 'Ana Gómez',
      question: 'Velocidad de agitación en fase de cristalización',
      answer: '12 RPM durante 45 minutos.',
      document: 'POE-Amoxicilina v2.1',
      datetime: '2026-05-30 09:02:11'
    },
    {
      id: 3,
      operator: 'Carlos Mendoza',
      question: 'Verificar lote de ibuprofeno anterior',
      answer: 'El lote L-IBU-108 fue aprobado ayer.',
      document: 'POE-Ibuprofeno v1.4',
      datetime: '2026-05-30 10:45:00'
    },
    {
      id: 4,
      operator: 'Pedro Salas',
      question: '¿Protocolo de derrame químico?',
      answer: 'Evacuar área 5m, usar kit de derrames tipo B.',
      document: 'Manual Seguridad Laboratorio',
      datetime: '2026-05-30 11:30:18'
    }
  ]);

  const columns = [
    { 
      header: 'Operario', 
      accessor: (row: any) => (
        <div className="font-medium text-slate-800">{row.operator}</div>
      ) 
    },
    { 
      header: 'Pregunta Transcrita', 
      accessor: (row: any) => (
        <div className="text-slate-600 italic">"{row.question}"</div>
      ) 
    },
    { 
      header: 'Respuesta de la IA', 
      accessor: (row: any) => (
        <div className="text-blue-700 font-medium">{row.answer}</div>
      ) 
    },
    { 
      header: 'Documento Referenciado', 
      accessor: (row: any) => (
        <div className="text-emerald-700 text-xs font-bold bg-emerald-50 inline-block px-2 py-1 rounded">
          {row.document}
        </div>
      ) 
    },
    { header: 'Fecha/Hora', accessor: 'datetime' as keyof any }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Historial de Auditoría</h2>
        <p className="text-sm text-slate-500 mt-1">Registro inmutable de todas las interacciones de voz en zonas estériles.</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <DataTable<any> data={history} columns={columns} />
        
        {/* Mock Pagination */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Mostrando 1 a 4 de 1,284 registros</p>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Anterior</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-700 hover:bg-slate-50">2</button>
            <button className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-700 hover:bg-slate-50">3</button>
            <span className="px-2 text-slate-400">...</span>
            <button className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-700 hover:bg-slate-50">Siguiente</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
