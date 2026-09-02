import { Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificacoes } from '../contexts/NotificacoesContext';
import './NotificationBell.css';

function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, refresh } = useNotificacoes();

  if (
    location.pathname === '/notificacoes' ||
    location.pathname === '/cadastro-pi' ||
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/cadastro' ||
    location.pathname === '/esqueci-senha' ||
    location.pathname.startsWith('/ativar-conta')
  ) return null;

  return (
    <div className="notification-bell-float" onClick={() => { navigate('/notificacoes'); refresh(); }}>
      <Bell size={22} />
      {unreadCount > 0 && <span className="notification-bell-float-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </div>
  );
}

export default NotificationBell;
