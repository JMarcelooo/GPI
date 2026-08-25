import API_URL from '../config';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Newspaper, ChevronDown, ChevronRight, RefreshCw, CheckCircle2, MinusCircle } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import Toast from '../Components/Toast';
import '../Tela2.css';
import './LogRPI.css';

const API = API_URL;

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

function LogRPI() {
  const [edicoes, setEdicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandidas, setExpandidas] = useState({});
  const [verificando, setVerificando] = useState(false);
  const [toastVerificacao, setToastVerificacao] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
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
    load();
  }, [load]);

  const toggleExpandida = (numero) => {
    setExpandidas(prev => ({ ...prev, [numero]: !prev[numero] }));
  };

  const handleVerificar = async () => {
    if (verificando) return;
    setVerificando(true);
    setToastVerificacao(null);
    try {
      const res = await axios.post(`${API}/api/rpi-monitor/verificar`);
      const r = res.data;
      const processadas = (r.resultados || []).filter(x => x.status === 'processada');

      if (processadas.length > 0) {
        for (const p of processadas) {
          if (p.criadas.rpis > 0) {
            await load();
          }
        }
        const totalRpis = processadas.reduce((s, p) => s + p.criadas.rpis, 0);
        const totalNotifs = processadas.reduce((s, p) => s + p.criadas.notificacoes, 0);
        setToastVerificacao({
          type: 'success',
          message: totalRpis > 0
            ? `${processadas.length} edição(ões) processada(s): ${totalRpis} RPI(s) e ${totalNotifs} notificação(ões).`
            : `${processadas.length} edição(ões) processada(s), sem alterações nas PIs monitoradas.`
        });
      } else if (r.status === 'ja_em_execucao') {
        setToastVerificacao({ type: 'success', message: 'Uma verificação já está em andamento.' });
      } else {
        setToastVerificacao({ type: 'success', message: 'Nenhuma edição nova publicada no INPI.' });
      }
    } catch (err) {
      setToastVerificacao({ type: 'error', message: err.response?.status === 403
        ? 'Acesso restrito a administradores.'
        : 'Erro ao verificar edições da RPI.' });
    } finally {
      setVerificando(false);
    }
  };

  const totalMudancas = edicoes.reduce((s, e) => s + (e.total_mudancas || 0), 0);

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <h2>Log da RPI</h2>
        </header>

        <div className="logrpi-header">
          <p className="logrpi-subtitle">
            {edicoes.length > 0
              ? `${edicoes.length} edição(ões) monitorada(s) · ${totalMudancas} alteração(ões) registrada(s)`
              : 'Publicações da Revista da Propriedade Industrial verificadas pelo sistema'}
          </p>
          <button className="logrpi-verificar" onClick={handleVerificar} disabled={verificando}>
            <RefreshCw size={16} className={verificando ? 'spin' : ''} />
            {verificando ? 'Verificando...' : 'Verificar agora'}
          </button>
        </div>

        {toastVerificacao && (
          <Toast
            type={toastVerificacao.type}
            message={toastVerificacao.message}
            onClose={() => setToastVerificacao(null)}
          />
        )}

        {error && <p className="logrpi-error">{error}</p>}

        {loading ? (
          <p className="logrpi-empty">Carregando...</p>
        ) : edicoes.length === 0 ? (
          <div className="logrpi-empty logrpi-empty--card">
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
      </div>
    </div>
  );
}

export default LogRPI;
