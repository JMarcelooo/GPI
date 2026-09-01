import API_URL from '../config';
import React, { useState, useEffect, useCallback } from "react";
import { Eye, Pencil, Trash2, ChevronUp, ChevronDown, SlidersHorizontal, X, Plus, FileText, Clock, CheckCircle2, AlertTriangle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from '../Components/Sidebar';
import "./PI.css";
import "./Payments.css";
import "../Tela2.css";
import { formatDate, formatStatus, formatTipo } from '../utils/formatDate';
import Toast from '../Components/Toast';
import { invalidatePis } from '../services/piApi';

const API = API_URL;
const PAGE_SIZE = 10;

const TIPOS_OPTS = [
  { value: 'patente de invencao', label: 'Patente de Invenção' },
  { value: 'modelo de utilidade', label: 'Modelo de Utilidade' },
  { value: 'marca', label: 'Marca' },
  { value: 'programa de computador', label: 'Programa de Computador' }
];

const STATUS_OPTS = [
  { value: 'em analise', label: 'Em Análise' },
  { value: 'deferida', label: 'Deferida' },
  { value: 'registrada', label: 'Registrada' },
  { value: 'carta patente', label: 'Carta Patente' },
  { value: 'indeferida', label: 'Indeferida' },
  { value: 'anulada', label: 'Anulada' },
  { value: 'arquivada', label: 'Arquivada' }
];

const ANO_ATUAL = new Date().getFullYear();
const ANOS = Array.from({ length: ANO_ATUAL - 1999 }, (_, i) => ANO_ATUAL - i);

function normalizeStatus(status) {
  return status.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
}

function getPageWindow(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: 5 }, (_, i) => start + i);
}

function PropriedadesIntelectuais() {
  document.title = 'GPI - Propriedades Intelectuais';
  const navigate = useNavigate();
  const [pis, setPis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [piToDelete, setPiToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [piStats, setPiStats] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const sortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const loadPIs = useCallback(async (page, term, flt, sField, sDir) => {
    setLoading(true);
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        q: term || undefined,
        status: flt.status || undefined,
        tipo: flt.tipo || undefined,
        ano: flt.ano || undefined,
        sort: sField || undefined,
        order: sDir
      };
      const res = await axios.get(`${API}/api/pi`, { params });
      setPis(res.data.data || []);
      setTotal(res.data.total || 0);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar PIs:", err);
      setPis([]);
      setTotal(0);
      setError('Não foi possível carregar as propriedades intelectuais.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    axios.get(`${API}/api/stats`)
      .then(res => setPiStats(res.data?.pi || null))
      .catch(() => setPiStats(null));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPIs(currentPage, searchTerm, filters, sortField, sortDir);
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, filters, sortField, sortDir, loadPIs]);

  const handleDeletePI = async () => {
    if (!piToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/api/pi/${piToDelete.id}`);
      invalidatePis();
      setPiToDelete(null);
      setToast({ message: 'PI excluída com sucesso!', type: 'success' });
      if (pis.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        loadPIs(currentPage, searchTerm, filters, sortField, sortDir);
      }
    } catch (err) {
      console.error("Erro ao deletar PI:", err);
      setToast({ message: 'Erro ao excluir PI.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPIs = pis;
  const indexOfFirstPI = (currentPage - 1) * PAGE_SIZE;
  const indexOfLastPI = Math.min(currentPage * PAGE_SIZE, total);
  const pageNumbers = getPageWindow(currentPage, totalPages);

  const temFiltrosAtivos = Boolean(filters.tipo || filters.status || filters.ano);

  const removerFiltro = (campo) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[campo];
      return next;
    });
    setCurrentPage(1);
  };

  const limparFiltros = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleQuickFilter = (campo, valor) => {
    setFilters(prev => {
      const next = { ...prev };
      if (valor) next[campo] = valor;
      else delete next[campo];
      return next;
    });
    setCurrentPage(1);
  };

  const paginate = (page) => setCurrentPage(page);

  const statCards = [
    { label: 'Total', value: piStats ? piStats.total : total, icon: FileText, bg: 'var(--color-primary-bg)', color: 'var(--color-primary)' },
    { label: 'Em análise', value: piStats ? piStats.emProcesso : 0, icon: Clock, bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    { label: 'Ativas', sub: 'Deferida/Registrada/Carta', value: piStats ? piStats.ativos : 0, icon: CheckCircle2, bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
    { label: 'Pendentes', sub: 'Indeferida/Anulada/Arquivada', value: piStats ? piStats.pendentes : 0, icon: AlertTriangle, bg: 'var(--color-error-bg)', color: 'var(--color-error)' },
  ];

  return (
    <div className="payments-page">
      <Sidebar />
      <div className="payments-content anim-rise">
        <div className="payments-header">
          <div>
            <h1 className="payments-title">Propriedades Intelectuais</h1>
            <p className="payments-subtitle">
              {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              {piStats && piStats.total > 0 && ` · ${piStats.emProcesso} em análise · ${piStats.ativos} ativas`}
            </p>
          </div>
          <button className="payments-btn-primary" onClick={() => navigate("/cadastro-pi")}>
            <Plus size={18} /> Nova PI
          </button>
        </div>

        <div className="payments-stats">
          {statCards.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <s.icon size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
                {s.sub && <span className="stat-amount">{s.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="table-section">
          <div className="table-toolbar">
            <div className="search-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por título, protocolo, depositante ou parceiro..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
            </div>
            <div className="payments-filtros">
              <select
                className="filtro-select"
                value={filters.status || ''}
                onChange={e => handleQuickFilter('status', e.target.value)}
                title="Filtrar por status"
              >
                <option value="">Todos os status</option>
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select
                className="filtro-select"
                value={filters.tipo || ''}
                onChange={e => handleQuickFilter('tipo', e.target.value)}
                title="Filtrar por tipo"
              >
                <option value="">Todos os tipos</option>
                {TIPOS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select
                className="filtro-select"
                value={filters.ano || ''}
                onChange={e => handleQuickFilter('ano', e.target.value)}
                title="Filtrar por ano"
              >
                <option value="">Todos os anos</option>
                {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {temFiltrosAtivos && (
                <button className="filtro-limpar" onClick={limparFiltros} title="Limpar filtros">
                  <X size={14} /> Limpar
                </button>
              )}
            </div>
          </div>

          {temFiltrosAtivos && (
            <div className="filtros-ativos" style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', marginBottom: 0 }}>
              <span className="filtros-ativos-label">
                <SlidersHorizontal size={13} /> Filtros:
              </span>
              {filters.tipo && (
                <span className="filtro-chip">
                  Tipo: {formatTipo(filters.tipo)}
                  <button onClick={() => removerFiltro('tipo')} title="Remover"><X size={12} /></button>
                </span>
              )}
              {filters.status && (
                <span className="filtro-chip">
                  Status: {formatStatus(filters.status)}
                  <button onClick={() => removerFiltro('status')} title="Remover"><X size={12} /></button>
                </span>
              )}
              {filters.ano && (
                <span className="filtro-chip">
                  Ano: {filters.ano}
                  <button onClick={() => removerFiltro('ano')} title="Remover"><X size={12} /></button>
                </span>
              )}
              <button className="filtro-limpar-tudo" onClick={limparFiltros}>
                Limpar tudo
              </button>
            </div>
          )}

          <div className="table-scroll">
            <table className="payments-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('tipo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Tipo {sortIcon('tipo')}
                  </th>
                  <th onClick={() => handleSort('titulo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Título {sortIcon('titulo')}
                  </th>
                  <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Status {sortIcon('status')}
                  </th>
                  <th>Protocolo</th>
                  <th>Depositante</th>
                  <th onClick={() => handleSort('data_entrada')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Data de Entrada {sortIcon('data_entrada')}
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>Carregando...</td></tr>
                ) : error ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-error)', padding: 24 }}>{error}</td></tr>
                ) : currentPIs.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>Nenhuma PI cadastrada</td></tr>
                ) : (
                  currentPIs.map(pi => (
                    <tr key={pi.id}>
                      <td style={{ fontWeight: 600 }}>{formatTipo(pi.tipo)}</td>
                      <td className="td-pi" style={{ maxWidth: 300 }}>
                        <span className="pi-titulo" title={pi.titulo}>
                          {pi.titulo || "-"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${normalizeStatus(pi.status)}`}>
                          {formatStatus(pi.status)}
                        </span>
                      </td>
                      <td>{pi.protocolo || "-"}</td>
                      <td>{pi.depositante || "-"}</td>
                      <td>{formatDate(pi.data_entrada)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => navigate(`/detalhes/${pi.id}`)} className="btn-acao" title="Visualizar"><Eye size={18} /></button>
                          <button onClick={() => navigate(`/editar-pi/${pi.id}`)} className="btn-acao" title="Editar"><Pencil size={18} /></button>
                          <button onClick={() => setPiToDelete(pi)} className="btn-acao" title="Excluir" style={{ color: 'var(--color-error)' }}><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {total > PAGE_SIZE && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 20, fontSize: 14
          }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Exibindo {indexOfFirstPI + 1}–{indexOfLastPI} de {total} PIs
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: currentPage === 1 ? 'var(--color-border-light)' : 'var(--color-surface)',
                  color: currentPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                  fontWeight: 600, fontSize: 13, cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >Anterior</button>
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                    background: currentPage === number ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: currentPage === number ? '#fff' : 'var(--color-text-secondary)',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer', minWidth: 36
                  }}
                >{number}</button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: currentPage === totalPages ? 'var(--color-border-light)' : 'var(--color-surface)',
                  color: currentPage === totalPages ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                  fontWeight: 600, fontSize: 13, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >Próxima</button>
            </div>
          </div>
        )}
      </div>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {piToDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => !deleting && setPiToDelete(null)}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 12, padding: 32, maxWidth: 420,
            width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--color-text)', fontSize: 18 }}>Confirmar exclusão</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
              Tem certeza que deseja excluir a PI <strong>{piToDelete.protocolo}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setPiToDelete(null)}
                disabled={deleting}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)', color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer'
                }}
              >Cancelar</button>
              <button
                onClick={handleDeletePI}
                disabled={deleting}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: 'var(--color-error)', color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1
                }}
              >{deleting ? "Excluindo..." : "Excluir"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropriedadesIntelectuais;
