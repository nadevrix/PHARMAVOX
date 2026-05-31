import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { UserPlus, User, X, Trash2, Shield, UserCheck, Edit2 } from 'lucide-react';
import { api, type UserResponse } from '../../services/api';

export function Users() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'pharmacist' | 'admin'>('pharmacist');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers('admin');
      setUsers(data);
    } catch (err) {
      setError('Error al obtener la lista de usuarios. Asegúrese de tener rol de Administrador.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setSubmitting(true);
    setError('');
    try {
      if (editingUser) {
        // Actualizar usuario existente
        await api.updateUser(editingUser.id, {
          full_name: fullName,
          email,
          role,
          password: password || undefined
        }, 'admin');
      } else {
        // Crear nuevo usuario
        if (!password) {
          setError('La contraseña es obligatoria para nuevos usuarios.');
          setSubmitting(false);
          return;
        }
        await api.createUser({
          full_name: fullName,
          email,
          role,
          password,
          timezone: 'America/Mexico_City'
        }, 'admin');
      }

      setFullName('');
      setEmail('');
      setPassword('');
      setRole('pharmacist');
      setEditingUser(null);
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (user: UserResponse) => {
    setEditingUser(user);
    setFullName(user.full_name);
    setEmail(user.email);
    setRole(user.role);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleNewClick = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setRole('pharmacist');
    setPassword('');
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar a este usuario?')) return;
    try {
      await api.deleteUser(id, 'admin');
      fetchUsers();
    } catch (err) {
      setError('Error al eliminar el usuario.');
    }
  };

  const columns = [
    {
      header: 'Usuario',
      accessor: (row: UserResponse) => (
        <div className="flex items-center space-x-3 py-2">
          <div className="bg-slate-100 p-2.5 rounded-full">
            <User className="w-4 h-4 text-[#00385F]" />
          </div>
          <div>
            <div className="font-bold text-slate-800">{row.full_name}</div>
            <div className="text-xs text-slate-400">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Rol',
      accessor: (row: UserResponse) => (
        <div className="flex items-center gap-1.5">
          {row.role === 'admin' ? (
            <span className="px-2.5 py-1 rounded bg-[#00385F]/15 text-[#00385F] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3" /> QA / Admin
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Operario (Zona Estéril)
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Estado',
      accessor: () => (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider bg-emerald-100 text-emerald-700">
          ACTIVO
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: (row: UserResponse) => (
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handleEditClick(row)}
            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Editar usuario"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteUser(row.id)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar usuario"
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
          <h2 className="text-2xl font-black text-[#00385F] uppercase" style={{ letterSpacing: '-0.02em' }}>Gestión de Personal</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Administra los accesos de operarios y administradores de QA.</p>
        </div>
        <button
          onClick={handleNewClick}
          className="flex items-center space-x-2 bg-[#004b7c] hover:bg-[#00385f] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl uppercase tracking-wider">
          🚨 {error}
        </div>
      )}

      <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm rounded-2xl">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Cargando base de datos de personal...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            No hay usuarios registrados en el sistema.
          </div>
        ) : (
          <DataTable data={users} columns={columns} />
        )}
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border border-slate-200 shadow-2xl rounded-3xl p-6 bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-[#00385F] uppercase tracking-wider">
                {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border-slate-200 rounded-xl py-2.5 px-3.5 border focus:ring-[#004b7c] focus:border-[#004b7c] text-sm text-slate-800 placeholder:text-slate-300 transition-all"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-slate-200 rounded-xl py-2.5 px-3.5 border focus:ring-[#004b7c] focus:border-[#004b7c] text-sm text-slate-800 placeholder:text-slate-300 transition-all"
                  placeholder="juan.perez@pharmavox.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Contraseña de Acceso {editingUser && '(Dejar en blanco para mantener)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-slate-200 rounded-xl py-2.5 px-3.5 border focus:ring-[#004b7c] focus:border-[#004b7c] text-sm text-slate-800 placeholder:text-slate-300 transition-all"
                  placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Mínimo 6 caracteres'}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rol de Seguridad</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'pharmacist' | 'admin')}
                  className="w-full border-slate-200 rounded-xl py-2.5 px-3.5 border focus:ring-[#004b7c] focus:border-[#004b7c] text-sm text-slate-800 transition-all"
                >
                  <option value="pharmacist">Operario (Zona Estéril)</option>
                  <option value="admin">Administrador / QA</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-[#004b7c] rounded-xl hover:bg-[#00385f] transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : editingUser ? 'Actualizar' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
