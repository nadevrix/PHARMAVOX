import { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { UploadCloud, File, Trash2, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api, type PDFListItem } from '../../services/api';

export function Documents() {
  const [docs, setDocs] = useState<PDFListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await api.listPDFs('admin');
      setDocs(data);
    } catch (err) {
      setError('Error al cargar la base de prospectos PDF.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.pdf')) {
      setError('Solo se permiten archivos en formato PDF.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await api.uploadPDF(file, 'admin');
      setSuccess(`Prospecto "${file.name}" cargado y procesado exitosamente por la Inteligencia Artificial.`);
      fetchDocs();
    } catch (err: any) {
      setError(err.message || 'Error al procesar el prospecto con la Inteligencia Artificial.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePDF = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este prospecto? Se eliminarán también todos los medicamentos y conocimientos asociados en la IA.')) return;
    try {
      await api.deletePDF(id, 'admin');
      setSuccess('Prospecto y base de conocimientos de IA eliminados correctamente.');
      fetchDocs();
    } catch (err) {
      setError('Error al eliminar el prospecto.');
    }
  };

  const handleDownloadPDF = async (id: number) => {
    try {
      await api.downloadPDF(id, 'admin');
    } catch (err) {
      setError('Error al iniciar la descarga del PDF.');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns = [
    {
      header: 'Nombre del Manual',
      accessor: (row: PDFListItem) => (
        <div className="flex items-center space-x-3 py-2">
          <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 flex-shrink-0">
            <File className="w-5 h-5 text-[#004b7c]" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-800 truncate block max-w-md">{row.filename}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">ID: {row.id} • TAMAÑO: {formatSize(row.file_size)}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Fecha de Subida',
      accessor: (row: PDFListItem) => {
        const date = new Date(row.created_at);
        return <span className="text-slate-600 font-medium">{date.toLocaleString()}</span>;
      }
    },
    {
      header: 'IA Estado',
      accessor: (row: PDFListItem) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${row.is_processed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {row.is_processed ? 'INDEXADO RAG' : 'PROCESANDO'}
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: (row: PDFListItem) => (
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handleDownloadPDF(row.id)}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Descargar prospecto PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeletePDF(row.id)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar prospecto del RAG"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-[#00385F] uppercase" style={{ letterSpacing: '-0.02em' }}>Base de Prospectos PDF</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Carga y administra los documentos clínicos oficiales que entrenan al asistente RAG.</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>🚨 {error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>✅ {success}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />
      <Card
        onClick={triggerFileInput}
        className="border-2 border-dashed border-[#004b7c]/30 hover:border-[#004b7c] bg-[#004b7c]/5 flex flex-col items-center justify-center py-12 cursor-pointer transition-all duration-300 rounded-[2rem]"
      >
        <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-slate-100">
          <UploadCloud className={`w-8 h-8 text-[#004b7c] ${uploading ? 'animate-bounce' : ''}`} />
        </div>
        <p className="text-slate-800 text-sm font-black uppercase tracking-wider mb-1">
          {uploading ? 'Procesando y analizando prospecto con IA...' : 'Haz clic para seleccionar o arrastra un Prospecto PDF'}
        </p>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
          Formatos soportados: PDF médico oficial (Máx 50MB)
        </p>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm rounded-2xl">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-xs font-black text-[#00385F] uppercase tracking-wider">Prospectos Médicos en Base Vectorial RAG</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Sincronizando base vectorial con el backend...
          </div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            No hay prospectos médicos cargados en el sistema.
          </div>
        ) : (
          <DataTable data={docs} columns={columns} />
        )}
      </Card>
    </div>
  );
}
