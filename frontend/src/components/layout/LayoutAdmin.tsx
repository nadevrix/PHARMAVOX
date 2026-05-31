
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, History, Users, LogOut, ShieldAlert } from 'lucide-react';

export function LayoutAdmin() {
  const location = useLocation();

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/documentos', icon: FileText, label: 'Documentos' },
    { path: '/admin/historial', icon: History, label: 'Historial' },
    { path: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 flex items-center space-x-3 text-white">
          <ShieldAlert className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="font-bold text-lg leading-tight">PharmaVox</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest">CONTROL QA</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <Link 
            to="/login"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {navItems.find(item => location.pathname.startsWith(item.path))?.label || 'Panel de Control'}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">Dra. Sofía Chávez</p>
              <p className="text-xs text-slate-500">Administrador / QA</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold">
              SC
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
