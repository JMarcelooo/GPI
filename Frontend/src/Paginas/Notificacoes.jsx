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

const PAGE_SIZE = 10;

function getPageWindow(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: 5 }, (_, i) => start + i);
}

function Notificacoes() {
  document.title = 'GPI - Notificações';
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('todas');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { refresh, markAllRead } = useNotificacoes();

  const load = useCallback(async (currentPage, currentFilter) => {
    setLoading(true);
    try {
      const lidaParam = currentFilter === 'lidas' ? 'true' : currentFilter === 'nao-lidas' ? 'false' : undefined;
      const res = await axios.get(`${API}/api/notificacoes`, {
        params: {
          limit: PAGE_SIZE,
          offset: (currentPage - 1) * PAGE_SIZE,
          lida: lidaParam
        }
      });
      setNotifications(res.data.data || []);
      setTotal(res.data.total || 0);
      setUnreadCount(res.data.unreadCount || 0);
      setError('');
    } catch (err) {
      setError('Erro ao carregar notificações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, filter);
  }, [page, filter, load]);

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
      await load(page, filter);
    } catch (err) {
      console.error('Erro ao atualizar notificação:', err);
    }
  };

  const handleDelete = async (n) => {
    try {
      await axios.delete(`${API}/api/notificacoes/${n.id}`);
      refresh();
      if (notifications.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await load(page, filter);
      }
    } catch (err) {
      console.error('Erro ao excluir notificação:', err);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setPage(1);
    await load(1, filter);
  };

  const handleAbrir = (n) => {
    if (n.tipo === 'rpi') {
      navigate(`/detalhes/${n.pi_id}`);
    } else {
      navigate(`/pagamentos?pagamento=${n.pagamento_id}`);
    }
  };

  const changeFilter = (key) => {
    setFilter(key);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const indexOfFirst = (page - 1) * PAGE_SIZE + 1;
  const indexOfLast = Math.min(page * PAGE_SIZE, total);
  const pageNumbers = getPageWindow(page, totalPages);

  const filters = [
    { key: 'todas', label: 'Todas' },
    { key: 'nao-lidas', label: 'Não lidas' },
    { key: 'lidas', label: 'Lidas' }
  ];

  return (
    <div className="container">
      <Sidebar />
      <div className="main anim-rise">
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
              onClick={() => changeFilter(f.key)}
            >
              {f.key === 'todas' ? <Bell size={15} /> : f.key === 'lidas' ? <CheckCircle2 size={15} /> : <BellOff size={15} />}
              {f.label}
            </button>
          ))}
        </div>

        {error && <p className="notificacoes-error">{error}</p>}

        {loading ? (
          <p className="notificacoes-empty">Carregando...</p>
        ) : notifications.length === 0 ? (
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
            {notifications.map((n) => (
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

        {!loading && total > PAGE_SIZE && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 20, fontSize: 14, flexWrap: 'wrap', gap: 12
          }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Exibindo {indexOfFirst}–{indexOfLast} de {total} notificações
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: page === 1 ? 'var(--color-border-light)' : 'var(--color-surface)',
                  color: page === 1 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                  fontWeight: 600, fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
              >Anterior</button>
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => setPage(number)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                    background: page === number ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: page === number ? '#fff' : 'var(--color-text-secondary)',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer', minWidth: 36
                  }}
                >{number}</button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: page === totalPages ? 'var(--color-border-light)' : 'var(--color-surface)',
                  color: page === totalPages ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                  fontWeight: 600, fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer'
                }}
              >Próxima</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notificacoes;
