import { Clock, Eye, EyeOff, CheckCircle2, MailOpen, CheckCheck, CalendarDays } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import { useNotificacoes } from '../contexts/NotificacoesContext';
import '../Tela2.css';
import './Notificacoes.css';

const API = process.env.REACT_APP_API_URL;

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Agora mesmo';
  const hours = Math.floor(minutes / 60);
  if (hours < 1) return `Há ${minutes} min`;
  const days = Math.floor(hours / 24);
  if (days < 1) return `Há ${hours} hora${hours !== 1 ? 's' : ''}`;
  if (days < 30) return `Há ${days} dia${days !== 1 ? 's' : ''}`;
  return date.toLocaleDateString('pt-BR');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

function Notificacoes() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { refresh, markAllRead } = useNotificacoes();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/notificacoes`);
      setNotifications(res.data.data || []);
      setError('');
    } catch (err) {
      setError('Erro ao carregar notificações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleRead = async (n) => {
    try {
      await axios.patch(`${API}/api/notificacoes/${n.id}`, { lida: !n.lida });
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, lida: !n.lida } : x));
      refresh();
    } catch (err) {
      console.error('Erro ao atualizar notificação:', err);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <h2>Notificações</h2>
        </header>

        <div className="notificacoes-header">
          <p className="notificacoes-subtitle">
            {unreadCount > 0
              ? `${unreadCount} notificação${unreadCount !== 1 ? 'ões' : ''} não lida${unreadCount !== 1 ? 's' : ''}`
              : 'Nenhuma notificação pendente'}
          </p>
          {unreadCount > 0 && (
            <button className="notificacoes-mark-all" onClick={handleMarkAllRead}>
              <CheckCheck size={16} /> Marcar todas como lidas
            </button>
          )}
        </div>

        {error && <p className="notificacoes-error">{error}</p>}

        {loading ? (
          <p className="notificacoes-empty">Carregando...</p>
        ) : notifications.length === 0 ? (
          <div className="notificacoes-empty">
            <MailOpen size={40} />
            <p>Nenhuma notificação. Os avisos de pagamentos próximos do prazo aparecerão aqui.</p>
          </div>
        ) : (
          <div className="notificacoes-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notificacao-item${n.lida ? ' is-read' : ''}`}
              >
                <div className={`notificacao-icon${n.lida ? ' notificacao-icon--read' : ''}`} style={n.lida ? {} : { color: 'var(--color-warning)' }}>
                  <Clock size={16} />
                </div>

                <div className="notificacao-content">
                  <div className="notificacao-title">
                    Prazo se aproximando
                    {!n.lida && <span className="notificacao-dot" />}
                  </div>
                  <p className="notificacao-message">{n.mensagem}</p>
                  <div className="notificacao-meta">
                    <span className="notificacao-time">{timeAgo(n.createdAt)}</span>
                    {n.data_vencimento && (
                      <span className="notificacao-vencimento">
                        <CalendarDays size={12} />
                        Vence em {formatDate(n.data_vencimento)}
                      </span>
                    )}
                    {n.lida && (
                      <span className="notificacao-read-tag">
                        <CheckCircle2 size={12} /> Lida
                      </span>
                    )}
                  </div>
                </div>

                <div className="notificacao-actions">
                  <button
                    className="notificacao-eye"
                    title={n.lida ? 'Marcar como não lida' : 'Marcar como lida'}
                    onClick={() => handleToggleRead(n)}
                  >
                    {n.lida ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notificacoes;
