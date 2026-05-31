import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { UserPlus, User, X } from 'lucide-react';

export function Users() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users] = useState([
    { id: 1, name: 'Carlos Mendoza', email: 'carlos.mendoza@farmacorp.com', role: 'Operario', status: 'Activo' },
    { id: 2, name: 'Ana Gómez', email: 'ana.gomez@farmacorp.com', role: 'Operario', status: 'Activo' },
    { id: 3, name: 'Dra. Sofía Chávez', email: 'sofia.chavez@farmacorp.com', role: 'QA / Admin', status: 'Activo' },
    { id: 4, name: 'Pedro Salas', email: 'pedro.salas@farmacorp.com', role: 'Operario', status: 'Baja' },
  ]);

  const columns = [
    {
      header: 'Usuario',
      accessor: (row: any) => (
        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 p-2 rounded-full">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <div className="font-bold text-slate-800">{row.name}</div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Rol',
      accessor: (row: any) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${row.role === 'Operario' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'
          }`}>
          {row.role.toUpperCase()}
        </span>
      )
    },
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
        <button className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors">
          Editar
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de Personal</h2>
          <p className="text-sm text-slate-500 mt-1">Administra los accesos de operarios y personal de QA.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        <DataTable data={users} columns={columns} />
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Crear Nuevo Usuario</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input type="text" className="w-full border-slate-300 rounded-lg py-2 px-3 border focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input type="email" className="w-full border-slate-300 rounded-lg py-2 px-3 border focus:ring-blue-500 focus:border-blue-500" placeholder="juan.perez@farmacorp.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol en el Sistema</label>
                <select className="w-full border-slate-300 rounded-lg py-2 px-3 border focus:ring-blue-500 focus:border-blue-500">
                  <option>Operario (Zona Estéril)</option>
                  <option>Administrador / QA</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
