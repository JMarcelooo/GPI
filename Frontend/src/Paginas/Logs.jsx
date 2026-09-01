import API_URL from '../config';
import {
  FileText, Wallet, Newspaper, Users, ShieldCheck,
  Search, X, History, RefreshCw,
  ChevronDown, ChevronRight, ChevronLeft, CheckCircle2, MinusCircle
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import Toast from '../Components/Toast';
import '../Tela2.css';
import './Logs.css';
import './LogRPI.css';

const API = API_URL;
const PAGE_SIZE = 15;

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
  { value: 'exclusao', label: 'Exclusão' },
  { value: 'falha', label: 'Falha' }
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
  document.title = 'GPI - Logs';
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

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

  const [aba, setAba] = useState('eventos');

  const carregar = useCallback(async (pag) => {
    setLoading(true);
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: (pag - 1) * PAGE_SIZE,
        ...(tipo && { tipo }),
        ...(acao && { acao }),
        ...(usuario && { usuario }),
        ...(qDebounced && { q: qDebounced }),
        ...(inicio && { inicio }),
        ...(fim && { fim })
      };
      const res = await axios.get(`${API}/api/historico`, { params });
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      setError('');
    } catch (err) {
      setError(err.response?.status === 403
        ? 'Acesso restrito a administradores.'
        : 'Erro ao carregar o histórico.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tipo, acao, usuario, qDebounced, inicio, fim]);

  useEffect(() => {
    setPage(1);
    carregar(1);
  }, [carregar]);

  const irParaPagina = (pag) => {
    const p = Math.min(Math.max(pag, 1), totalPages);
    setPage(p);
    carregar(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paginasVisiveis = () => {
    const janela = 2;
    const nums = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= page - janela && p <= page + janela)) {
        nums.push(p);
      }
    }
    const resultado = [];
    let prev = 0;
    nums.forEach(p => {
      if (prev && p - prev > 1) resultado.push('...');
      resultado.push(p);
      prev = p;
    });
    return resultado;
  };

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

  const abrirDestino = (item) => {
    if (item.pi_id) navigate(`/detalhes/${item.pi_id}`);
  };

  return (
    <div className="container">
      <Sidebar />
      <div className="main anim-fade">
        <header className="topbar">
          <h2>Logs</h2>
        </header>

        <div className="logs-tabs">
          <button
            className={`logs-tab${aba === 'eventos' ? ' logs-tab--ativo' : ''}`}
            onClick={() => setAba('eventos')}
          >
            Eventos
          </button>
          <button
            className={`logs-tab${aba === 'rpi' ? ' logs-tab--ativo' : ''}`}
            onClick={() => setAba('rpi')}
          >
            Edições da RPI
          </button>
        </div>

        {aba === 'eventos' ? (
          <>
            <div className="logs-header">
              <p className="logs-subtitle">
                {total > 0
                  ? `${total} evento${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`
                  : 'Histórico de ações do sistema'}
              </p>
            </div>

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

            {loading && items.length > 0 && (
              <p className="logs-loading-mini">Carregando...</p>
            )}

            {totalPages > 1 && (
              <div className="logs-paginacao">
                <button
                  type="button"
                  className="logs-pag-btn"
                  onClick={() => irParaPagina(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft size={16} /> Anterior
                </button>

                {paginasVisiveis().map((p, i) => p === '...' ? (
                  <span key={`e${i}`} className="logs-pag-ellipsis">…</span>
                ) : (
                  <button
                    type="button"
                    key={p}
                    className={`logs-pag-btn${p === page ? ' logs-pag-btn--ativo' : ''}`}
                    onClick={() => irParaPagina(p)}
                    disabled={loading}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  className="logs-pag-btn"
                  onClick={() => irParaPagina(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Próxima <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
        </>
      ) : (
        <RpiEdicoes />
      )}
      </div>
    </div>
  );
}

function RpiEdicoes() {
  const [edicoes, setEdicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandidas, setExpandidas] = useState({});
  const [verificando, setVerificando] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/rpi-monitor/log`);
      setEdicoes(res.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.status === 403
        ? 'Acesso restrito a administradores.'
        : 'Erro ao carregar o log de edições.');
      setEdicoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const toggleExpandida = (numero) => {
    setExpandidas(prev => ({ ...prev, [numero]: !prev[numero] }));
  };

  const handleVerificar = async () => {
    if (verificando) return;
    setVerificando(true);
    setToast(null);
    try {
      const res = await axios.post(`${API}/api/rpi-monitor/verificar`);
      const r = res.data;
      const processadas = (r.resultados || []).filter(x => x.status === 'processada');
      if (processadas.length > 0) {
        await carregar();
        const totalRpis = processadas.reduce((s, p) => s + (p.criadas?.rpis || 0), 0);
        const totalNotifs = processadas.reduce((s, p) => s + (p.criadas?.notificacoes || 0), 0);
        setToast({
          type: 'success',
          message: totalRpis > 0
            ? `${processadas.length} edição(ões) processada(s): ${totalRpis} RPI(s) e ${totalNotifs} notificação(ões).`
            : `${processadas.length} edição(ões) processada(s), sem alterações nas PIs monitoradas.`
        });
      } else if (r.status === 'ja_em_execucao') {
        setToast({ type: 'success', message: 'Uma verificação já está em andamento.' });
      } else {
        setToast({ type: 'success', message: 'Nenhuma edição nova publicada no INPI.' });
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.status === 403
          ? 'Acesso restrito a administradores.'
          : (err.response?.data?.error || 'Erro ao verificar edições da RPI.')
      });
    } finally {
      setVerificando(false);
    }
  };

  const totalMudancas = edicoes.reduce((s, e) => s + (e.total_mudancas || 0), 0);

  return (
    <>
      <div className="logs-header">
        <p className="logs-subtitle">
          {edicoes.length > 0
            ? `${edicoes.length} edição(ões) monitorada(s) · ${totalMudancas} alteração(ões) registrada(s)`
            : 'Publicações da Revista da Propriedade Industrial verificadas pelo sistema'}
        </p>
        <button className="logs-verificar" onClick={handleVerificar} disabled={verificando}>
          <RefreshCw size={16} className={verificando ? 'logs-spin' : ''} />
          {verificando ? 'Verificando...' : 'Verificar RPIs'}
        </button>
      </div>

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      {error && <p className="logs-error">{error}</p>}

      {loading ? (
        <p className="logs-empty">Carregando...</p>
      ) : edicoes.length === 0 ? (
        <div className="logs-empty">
          <Newspaper size={40} />
          <p>O monitor ainda não processou nenhuma edição da RPI.</p>
        </div>
      ) : (
        <div className="logrpi-list">
          {edicoes.map((e) => {
            const aberta = expandidas[e.numero];
            const temMudancas = (e.total_mudancas || 0) > 0;
            return (
              <div key={e.numero} className={`logrpi-edicao${temMudancas ? '' : ' logrpi-edicao--vazia'}`}>
                <button
                  className="logrpi-cabecalho"
                  onClick={() => temMudancas && toggleExpandida(e.numero)}
                  disabled={!temMudancas}
                  title={temMudancas ? undefined : 'Edição sem alterações nas PIs monitoradas'}
                >
                  {temMudancas ? (
                    aberta ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                  ) : (
                    <MinusCircle size={18} />
                  )}
                  <span className="logrpi-numero">RPI {e.numero}</span>
                  <span className="logrpi-datas">publicada {formatarData(e.data_publicacao)}</span>
                  <span className={`logrpi-badge${temMudancas ? '' : ' logrpi-badge--vazia'}`}>
                    {temMudancas
                      ? `${e.total_mudancas} alteração${e.total_mudancas !== 1 ? 'ões' : ''}`
                      : 'Sem alterações'}
                  </span>
                  <span className="logrpi-processada">processada em {formatarMomento(e.processada_em)}</span>
                </button>

                {temMudancas && aberta && (
                  <div className="logrpi-mudancas">
                    {e.mudancas.map((m) => (
                      <button key={m.historico_id} className="logrpi-mudanca" onClick={() => navigate(`/detalhes/${m.pi_id}`)}>
                        <CheckCircle2 size={15} />
                        <div className="logrpi-mudanca-conteudo">
                          <span className="logrpi-pi-titulo">{m.pi_titulo || `PI ${m.pi_id}`}</span>
                          <p className="logrpi-pi-descricao">{m.descricao}</p>
                        </div>
                        <span className="logrpi-mudanca-hora">{formatarMomento(m.createdAt)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function formatarData(dataStr) {
  if (!dataStr) return '-';
  const d = new Date(String(dataStr).slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}

function formatarMomento(dataStr) {
  if (!dataStr) return '-';
  const d = new Date(dataStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default Logs;
