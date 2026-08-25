import API_URL from '../config';
import React, { useState, useEffect, useCallback } from "react";
import { Eye, Pencil, Trash2, ChevronUp, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from '../Components/Sidebar';
import "./PI.css";
import "../Tela2.css";
import { formatDate, formatStatus, formatTipo } from '../utils/formatDate';
import FilterPIModal from '../Components/FilterPIModal';
import Toast from '../Components/Toast';
import { invalidatePis } from '../services/piApi';

const API = API_URL;
const PAGE_SIZE = 10;

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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [piToDelete, setPiToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

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

  const paginate = (page) => setCurrentPage(page);

  return (
    <div className="container">
      <Sidebar />

      <div className="main">
        <div className="container-pi">
          <div className="conteudo-pi">
            <h2>Propriedades Intelectuais</h2>

            <div className="filtros-topo">
              <input
                type="text"
                placeholder="Buscar por título, protocolo, depositante ou parceiro..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
              <button className="filter-button" onClick={() => setShowFilterModal(true)}>
                <SlidersHorizontal size={16} className="filter-icon" /> Filtros
                {temFiltrosAtivos && <span className="filtro-dot" />}
              </button>
              <button className="btn-novo-pi" onClick={() => navigate("/cadastro-pi")}>
                + Cadastrar Nova PI
              </button>
            </div>

            {temFiltrosAtivos && (
              <div className="filtros-ativos">
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

            <div className="tabela-pi-scroll">
            <table className="tabela-pi">
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort('tipo')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Tipo {sortIcon('tipo')}
                  </th>
                  <th
                    onClick={() => handleSort('titulo')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Título {sortIcon('titulo')}
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Status {sortIcon('status')}
                  </th>
                  <th>Protocolo</th>
                  <th>Depositante</th>
                  <th
                    onClick={() => handleSort('data_entrada')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Data de Entrada {sortIcon('data_entrada')}
                  </th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7">Carregando...</td></tr>
                ) : error ? (
                  <tr><td colSpan="7">{error}</td></tr>
                ) : currentPIs.length === 0 ? (
                  <tr><td colSpan="7">Nenhuma PI cadastrada</td></tr>
                ) : (
                  currentPIs.map(pi => (
                    <tr key={pi.id}>
                      <td>{formatTipo(pi.tipo)}</td>
                      <td>
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
                        <div className="tabela-pi-acoes">
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
        </div>
      </div>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {showFilterModal && (
        <FilterPIModal
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={(f) => { setFilters(f); setCurrentPage(1); }}
          currentFilters={filters}
        />
      )}
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
