import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import Login from './Paginas/Login';
import Dashboard from './Paginas/Dashboard';
import PropriedadesIntelectuais from './Paginas/PropriedadesIntelectuais';
import PatenteDetalhes from "./Paginas/PatenteDetalhes"; // <- componente de detalhes
import CadastroPI from './Paginas/CadastroPI.jsx';
import EditarPI from './Paginas/EditarPI';
import Payments from './Paginas/Payments';
import Autor from './Paginas/Autor';
import AutorDetalhes from './Paginas/AutorDetalhes';
import Notificacoes from './Paginas/Notificacoes';
import Configuracoes from './Paginas/Configuracoes';
import Usuarios from './Paginas/Usuarios';
import Logs from './Paginas/Logs';
import NotificationBell from './Components/NotificationBell';
import Toast from './Components/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificacoesProvider } from './contexts/NotificacoesContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { onToast } from './services/events';
import './services/apiClient';

// Toast global: o interceptor do axios (fora do React) dispara via events.js.
function AppToast() {
  const [toast, setToast] = useState(null);
  const handleClose = useCallback(() => setToast(null), []);
  useEffect(() => onToast((t) => setToast(t)), []);
  if (!toast) return null;
  return (
    <Toast
      message={toast.message}
      type={toast.type}
      duration={toast.duration}
      actionLabel={toast.actionLabel}
      onAction={toast.onAction}
      onClose={handleClose}
    />
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function LoginRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <NotificacoesProvider>
            <NotificationBell />
            <AppToast />
            <Routes>
              <Route path="/" element={<LoginRoute><Login /></LoginRoute>} />
              <Route path="/login" element={<LoginRoute><Login /></LoginRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/propriedade-intelectual" element={<ProtectedRoute><PropriedadesIntelectuais /></ProtectedRoute>} />
              <Route path="/detalhes/:id" element={<ProtectedRoute><PatenteDetalhes /></ProtectedRoute>} />
              <Route path="/cadastro-pi" element={<ProtectedRoute><CadastroPI /></ProtectedRoute>} />
              <Route path="/editar-pi/:id" element={<ProtectedRoute><EditarPI /></ProtectedRoute>} />
              <Route path="/pagamentos" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/autores" element={<ProtectedRoute><Autor /></ProtectedRoute>} />
              <Route path="/autores/:id" element={<ProtectedRoute><AutorDetalhes /></ProtectedRoute>} />
              <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
              <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
              <Route path="/logs" element={<AdminRoute><Logs /></AdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificacoesProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
