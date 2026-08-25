import API_URL from '../config';
import {
  FileText, Wallet, Newspaper, Users, ShieldCheck,
  Search, X, History, RefreshCw
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import Toast from '../Components/Toast';
import '../Tela2.css';
import './Logs.css';

const API = API_URL;
const PAGE_SIZE = 30;

const TIPOS = [
  { value: 'pi', label: 'PI', icon: FileText },
  { value: 'pagamento', label: 'Pagamento', icon: Wallet },
  { value: 'rpi', label: 'RPI', icon: Newspaper },
  { value: 'autor', label: 'Autor', icon: Users },
  { value: 'usuario', label: 'Usuário', icon: ShieldCheck }
];

const ACES = [
  { value: 'criacao', label: 'Criação' },
  { value: 'atualizacao', label: 'Atualização' },
  { value: 'exclusao', label: 'Exclusão' }
];

const ACES_LABEL = Object.fromEntries(ACES.map(a => [a.value, a.label]));

const ICONES_TIPO = Object.fromEntries(TIPOS.map(t => [t.value, t.icon]));

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Agora mesmo';
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours} hora${hours !== 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Há ${days} dia${days !== 1 ? 's' : ''}`;
  return date.toLocaleDateString('pt-BR');
}

function dataCompleta(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR');
}

function Logs() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);

  const [tipo, setTipo] = useState('');
  const [acao, setAcao] = useState('');
  const [usuario, setUsuario] = useState('');
  const [q, setQ] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');

  const navigate = useNavigate();

  // Busca textual com debounce para não disparar requisição a cada tecla.
  const [qDebounced, setQDebounced] = useState('');
  const timerRef = useRef(null);
  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setQDebounced(q), 400);
    return () => clearTimeout(timerRef.current);
  }, [q]);

  const [verificando, setVerificando] = useState(false);
  const [toastVerificacao, setToastVerificacao] = useState(null);

  const handleVerificar = async () => {
    if (verificando) return;
    setVerificando(true);
    setToastVerificacao(null);
    try {
      const res = await axios.post(`${API}/api/rpi-monitor/verificar`);
      const r = res.data;
      if (r.status === 'ja_em_execucao') {
        setToastVerificacao({ type: 'success', message: 'Uma verificação já está em andamento.' });
      } else if ((r.resultados || []).length === 0) {
        setToastVerificacao({ type: 'success', message: 'Nenhuma edição nova publicada no INPI.' });
      } else {
        const processadas = r.resultados.filter(x => x.status === 'processada');
        const totalRpis = processadas.reduce((s, p) => s + (p.criadas?.rpis || 0), 0);
        const totalLogs = processadas.reduce((s, p) => s + (p.criadas?.notificacoes || 0) + (p.criadas?.rpis || 0), 0);
        setToastVerificacao({
          type: 'success',
          message: processadas.length > 0
            ? `${processadas.length} edição(ões) processada(s): ${totalRpis} RPI(s) registrada(s). Recarregando...`
            : 'Edições verificadas, sem alterações nas PIs monitoradas.'
        });
        if (processadas.length > 0 && totalLogs > 0) carregar(0, false);
      }
    } catch (err) {
      setToastVerificacao({
        type: 'error',
        message: err.response?.status === 403
          ? 'Acesso restrito a administradores.'
          : 'Erro ao verificar edições da RPI.'
      });
    } finally {
      setVerificando(false);
    }
  };

  const carregar = useCallback(async (off, acumular) => {
    setLoading(true);
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: off,
        ...(tipo && { tipo }),
        ...(acao && { acao }),
        ...(usuario && { usuario }),
        ...(qDebounced && { q: qDebounced }),
        ...(inicio && { inicio }),
        ...(fim && { fim })
      };
      const res = await axios.get(`${API}/api/historico`, { params });
      setItems(prev => (acumular ? [...prev, ...res.data.data] : res.data.data));
      setTotal(res.data.total || 0);
      setError('');
    } catch (err) {
      setError(err.response?.status === 403
        ? 'Acesso restrito a administradores.'
        : 'Erro ao carregar o histórico.');
      if (!acumular) setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tipo, acao, usuario, qDebounced, inicio, fim]);

  useEffect(() => {
    setOffset(0);
    carregar(0, false);
  }, [carregar]);

  useEffect(() => {
    axios.get(`${API}/api/historico/usuarios`)
      .then(res => setUsuarios(res.data.data || []))
      .catch(() => {});
  }, []);

  const temFiltros = tipo || acao || usuario || qDebounced || inicio || fim;

  const limparFiltros = () => {
    setTipo('');
    setAcao('');
    setUsuario('');
    setQ('');
    setInicio('');
    setFim('');
  };

  const carregarMais = () => {
    const proximo = offset + PAGE_SIZE;
    setOffset(proximo);
    carregar(proximo, true);
  };

  const abrirDestino = (item) => {
    if (item.pi_id) navigate(`/detalhes/${item.pi_id}`);
  };

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <h2>Logs</h2>
        </header>

        <div className="logs-header">
          <p className="logs-subtitle">
            {total > 0
              ? `${total} evento${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`
              : 'Histórico de ações do sistema'}
          </p>
          <button className="logs-verificar" onClick={handleVerificar} disabled={verificando}>
            <RefreshCw size={16} className={verificando ? 'logs-spin' : ''} />
            {verificando ? 'Verificando...' : 'Verificar RPIs'}
          </button>
        </div>

        {toastVerificacao && (
          <Toast
            type={toastVerificacao.type}
            message={toastVerificacao.message}
            onClose={() => setToastVerificacao(null)}
          />
        )}

        <div className="logs-filtros">
          <div className="logs-filtro">
            <label htmlFor="log-tipo">Tipo</label>
            <select id="log-tipo" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="">Todos</option>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="logs-filtro">
            <label htmlFor="log-acao">Ação</label>
            <select id="log-acao" value={acao} onChange={e => setAcao(e.target.value)}>
              <option value="">Todas</option>
              {ACES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          <div className="logs-filtro">
            <label htmlFor="log-usuario">Usuário</label>
            <select id="log-usuario" value={usuario} onChange={e => setUsuario(e.target.value)}>
              <option value="">Todos</option>
              {usuarios.map(u => (
                <option key={u} value={u}>{u === 'Sistema' ? 'Sistema (automático)' : u}</option>
              ))}
            </select>
          </div>

          <div className="logs-filtro">
            <label htmlFor="log-q">Busca</label>
            <div className="logs-busca">
              <Search size={14} />
              <input
                id="log-q"
                type="text"
                placeholder="Buscar na descrição..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="logs-filtro">
            <label htmlFor="log-inicio">De</label>
            <input id="log-inicio" type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
          </div>

          <div className="logs-filtro">
            <label htmlFor="log-fim">Até</label>
            <input id="log-fim" type="date" value={fim} onChange={e => setFim(e.target.value)} />
          </div>

          {temFiltros && (
            <button className="logs-limpar" onClick={limparFiltros}>
              <X size={14} /> Limpar
            </button>
          )}
        </div>

        {error && <p className="logs-error">{error}</p>}

        {loading && items.length === 0 ? (
          <p className="logs-empty">Carregando...</p>
        ) : items.length === 0 ? (
          <div className="logs-empty">
            <History size={40} />
            <p>Nenhum evento encontrado{temFiltros ? ' com os filtros atuais.' : '.'}</p>
          </div>
        ) : (
          <>
            <div className="logs-list">
              {items.map(item => {
                const Icone = ICONES_TIPO[item.tipo] || History;
                const autorEvento = item.usuario_nome || 'Sistema';
                return (
                  <div key={item.id} className={`log-item log-item--${item.tipo}`}>
                    <span className="log-icone"><Icone size={16} /></span>
                    <div className="log-conteudo">
                      <div className="log-topo">
                        <span className={`log-badge log-badge--${item.acao}`}>{ACES_LABEL[item.acao] || item.acao}</span>
                        {(item.pi_titulo || item.pi_id) && (
                          <button
                            className="log-pi-titulo"
                            onClick={() => abrirDestino(item)}
                            style={{ background: 'none', border: 'none', cursor: item.pi_id ? 'pointer' : 'default', padding: 0 }}
                          >
                            {item.pi_titulo || `PI ${item.pi_id}`}
                          </button>
                        )}
                      </div>
                      <p className="log-descricao">{item.descricao}</p>
                      <div className="log-meta">
                        <span>por <span className="log-quem">{autorEvento}</span></span>
                        <span title={dataCompleta(item.createdAt)}>{timeAgo(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {items.length < total && (
              <button className="logs-mais" onClick={carregarMais} disabled={loading}>
                {loading ? 'Carregando...' : 'Carregar mais'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Logs;
