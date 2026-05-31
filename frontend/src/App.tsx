import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { SterileZone } from './pages/pharmaceutical/SterileZone';
import { LayoutAdmin } from './components/layout/LayoutAdmin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Documents } from './pages/admin/Documents';
import { History } from './pages/admin/History';
import { Users } from './pages/admin/Users';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Operario Flow */}
        <Route path="/farmaceutico" element={<SterileZone />} />

        {/* QA / Admin Flow */}
        <Route path="/admin" element={<LayoutAdmin />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="documentos" element={<Documents />} />
          <Route path="historial" element={<History />} />
          <Route path="usuarios" element={<Users />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
