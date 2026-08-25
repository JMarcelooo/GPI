import API_URL from '../config';
import { Clock, Eye, EyeOff, CheckCircle2, MailOpen, CheckCheck, CalendarDays, Trash2, Bell, BellOff, Newspaper } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import { useNotificacoes } from '../contexts/NotificacoesContext';
import '../Tela2.css';
import './Notificacoes.css';

const API = API_URL;

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

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function Notificacoes() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('todas');
  const navigate = useNavigate();
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
      const res = await axios.patch(`${API}/api/notificacoes/${n.id}`, { lida: !n.lida });
      const updated = res.data?.data;
      if (updated) {
        setNotifications(prev => prev.map(x => x.id === updated.id ? updated : x));
      } else {
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, lida: !n.lida } : x));
      }
      refresh();
    } catch (err) {
      console.error('Erro ao atualizar notificação:', err);
    }
  };

  const handleDelete = async (n) => {
    try {
      await axios.delete(`${API}/api/notificacoes/${n.id}`);
      setNotifications(prev => prev.filter(x => x.id !== n.id));
      refresh();
    } catch (err) {
      console.error('Erro ao excluir notificação:', err);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    load();
  };

  const handleAbrir = (n) => {
    if (n.tipo === 'rpi') {
      navigate(`/detalhes/${n.pi_id}`);
    } else {
      navigate(`/pagamentos?pagamento=${n.pagamento_id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  const filtered = notifications.filter(n => {
    if (filter === 'nao-lidas') return !n.lida;
    if (filter === 'lidas') return n.lida;
    return true;
  });

  const filters = [
    { key: 'todas', label: 'Todas' },
    { key: 'nao-lidas', label: 'Não lidas' },
    { key: 'lidas', label: 'Lidas' }
  ];

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
          <div className="notificacoes-header-actions">
            {unreadCount > 0 && (
              <button className="notificacoes-mark-all" onClick={handleMarkAllRead}>
                <CheckCheck size={16} /> Marcar todas como lidas
              </button>
            )}
          </div>
        </div>

        <div className="notificacoes-filters">
          {filters.map(f => (
            <button
              key={f.key}
              className={`filter-btn${filter === f.key ? ' filter-btn--active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.key === 'todas' ? <Bell size={15} /> : f.key === 'lidas' ? <CheckCircle2 size={15} /> : <BellOff size={15} />}
              {f.label}
            </button>
          ))}
        </div>

        {error && <p className="notificacoes-error">{error}</p>}

        {loading ? (
          <p className="notificacoes-empty">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="notificacoes-empty">
            <MailOpen size={40} />
            <p>
              {filter === 'todas'
                ? 'Nenhuma notificação. Avisos de pagamentos próximos do prazo e de publicações na RPI aparecerão aqui.'
                : `Nenhuma notificação ${filter === 'nao-lidas' ? 'não lida' : 'lida'} no momento.`}
            </p>
          </div>
        ) : (
          <div className="notificacoes-list">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`notificacao-item${n.lida ? ' is-read' : ''}`}
              >
                <button
                  className="notificacao-open"
                  onClick={() => handleAbrir(n)}
                  title={n.tipo === 'rpi' ? 'Abrir PI' : 'Abrir pagamento'}
                >
                  <div className={`notificacao-icon${n.lida ? ' notificacao-icon--read' : ''}`} style={n.lida ? {} : { color: n.tipo === 'rpi' ? 'var(--color-primary)' : 'var(--color-warning)' }}>
                    {n.tipo === 'rpi' ? <Newspaper size={16} /> : <Clock size={16} />}
                  </div>

                  <div className="notificacao-content">
                    <div className="notificacao-title">
                      {n.tipo === 'rpi' ? 'Publicação na RPI' : 'Prazo se aproximando'}
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
                          <CheckCircle2 size={12} />
                          {n.lida_por_nome ? <>Lida por {n.lida_por_nome} em {formatDateTime(n.lida_em)}</> : 'Lida'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                <div className="notificacao-actions">
                  <button
                    className="notificacao-eye"
                    title={n.lida ? 'Marcar como não lida' : 'Marcar como lida'}
                    onClick={() => handleToggleRead(n)}
                  >
                    {n.lida ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    className="notificacao-trash"
                    title="Excluir notificação"
                    onClick={() => handleDelete(n)}
                  >
                    <Trash2 size={18} />
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
