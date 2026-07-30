import React from 'react';
import { Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NotificationBell.css';

function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/notificacoes') return null;

  return (
    <div className="notification-bell-float" onClick={() => navigate('/notificacoes')}>
      <Bell size={22} />
      <span className="notification-bell-float-badge">3</span>
    </div>
  );
}

export default NotificationBell;
