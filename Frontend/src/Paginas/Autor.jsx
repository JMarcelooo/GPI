import API_URL from '../config';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Pencil, Trash2, Eye, ChevronUp, ChevronDown, X } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import UpdateAuthorModal from '../Components/UpdateAuthorModal';
import FilterAuthorModal from '../Components/FilterAuthorModal';
import ConfirmDeleteModal from '../Components/ConfirmDeleteModal';
import Toast from '../Components/Toast';
import axios from 'axios';
import "./PI.css";
import "../Tela2.css";

const API = API_URL;
const PAGE_SIZE = 10;

const formatPhone = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

function getPageWindow(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: 5 }, (_, i) => start + i);
}

const FILTRO_LABELS = {
  gender: 'Gênero',
  bond: 'Vínculo',
  campus: 'Campus',
  department: 'Departamento',
  university: 'Universidade'
};

export default function Autor() {
  document.title = 'GPI - Autores';
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [authors, setAuthors] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [authorToDelete, setAuthorToDelete] = useState(null);
    const [filters, setFilters] = useState({});
    const [sortField, setSortField] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const [toast, setToast] = useState(null);

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

    const loadAuthors = useCallback(async (page, term, flt, sField, sDir) => {
      setLoading(true);
      try {
        const params = {
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          q: term || undefined,
          gender: flt.gender || undefined,
          bond: flt.bond || undefined,
          campus: flt.campus || undefined,
          department: flt.department || undefined,
          university: flt.university || undefined,
          sort: sField || undefined,
          order: sDir
        };
        const response = await axios.get(`${API}/api/autores`, { params });
        setAuthors(response.data.data || []);
        setTotal(response.data.total || 0);
        setError(null);
      } catch (error) {
        console.error("Erro ao buscar autores:", error);
        setAuthors([]);
        setTotal(0);
        setError('Não foi possível carregar os autores.');
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      const timer = setTimeout(() => {
        loadAuthors(currentPage, searchTerm, filters, sortField, sortDir);
      }, searchTerm ? 300 : 0);
      return () => clearTimeout(timer);
    }, [currentPage, searchTerm, filters, sortField, sortDir, loadAuthors]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const currentAuthors = authors;
    const indexOfFirstAuthor = (currentPage - 1) * PAGE_SIZE;
    const indexOfLastAuthor = Math.min(currentPage * PAGE_SIZE, total);
    const pageNumbers = getPageWindow(currentPage, totalPages);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Filtros
    const handleOpenFilterModal = () => setShowFilterModal(true);
    const handleCloseFilterModal = () => setShowFilterModal(false);
    const handleApplyFilters = (newFilters) => {
      setFilters(newFilters);
      setCurrentPage(1);
    };
    const temFiltrosAtivos = Boolean(
      filters.gender || filters.bond || filters.campus || filters.department || filters.university
    );
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

    // Modal de edição
    const handleOpenUpdateModal = (author) => {
        setSelectedAuthor(author);
        setShowUpdateModal(true);
    };
    const handleCloseUpdateModal = () => setShowUpdateModal(false);

    const handleOpenViewModal = (author) => {
      navigate(`/autores/${author.id}`);
    };

    const handleOpenDeleteModal = (author) => {
      setAuthorToDelete(author);
      setShowDeleteModal(true);
    };
    const handleCloseDeleteModal = () => {
      setAuthorToDelete(null);
      setShowDeleteModal(false);
    };

    const handleUpdateSuccess = async (updatedAuthor) => {
        await axios.put(`${API}/api/autores/${updatedAuthor.id}`, updatedAuthor);
        loadAuthors(currentPage, searchTerm, filters, sortField, sortDir);
        handleCloseUpdateModal();
    };

    const handleDeleteAuthor = async () => {
    if (!authorToDelete) return;
    try {
        await axios.delete(`${API}/api/autores/${authorToDelete.id}`);
        handleCloseDeleteModal();
        setToast({ message: 'Autor excluído com sucesso!', type: 'success' });
        if (authors.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          loadAuthors(currentPage, searchTerm, filters, sortField, sortDir);
        }
    } catch (error) {
        handleCloseDeleteModal();
        const status = error.response?.status;
        const msg = (status === 400 || status === 409) && error.response?.data?.error
          ? error.response.data.error
          : 'Erro ao excluir autor. Verifique se ele não está vinculado a uma PI.';
        setToast({ message: msg, type: 'error' });
        console.error("Erro ao deletar autor:", error);
    }
    };

    return (
        <div className="container">
            <Sidebar />
            <div className="main">
                <div className="container-pi">
                    <div className="conteudo-pi">
                        <h2>Autores</h2>

                        <div className="filtros-topo">
                            <input
                                type="text"
                                placeholder="Buscar por nome, e-mail, instituição..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                            <button className="filter-button" onClick={handleOpenFilterModal}>
                                <SlidersHorizontal size={16} className="filter-icon" /> Filtros
                                {temFiltrosAtivos && <span className="filtro-dot" />}
                            </button>
                        </div>

                        {temFiltrosAtivos && (
                            <div className="filtros-ativos">
                                <span className="filtros-ativos-label">
                                    <SlidersHorizontal size={13} /> Filtros:
                                </span>
                                {Object.entries(filters).map(([campo, valor]) => (
                                    valor ? (
                                        <span className="filtro-chip" key={campo}>
                                            {FILTRO_LABELS[campo] || campo}: {valor}
                                            <button onClick={() => removerFiltro(campo)} title="Remover"><X size={12} /></button>
                                        </span>
                                    ) : null
                                ))}
                                <button className="filtro-limpar-tudo" onClick={limparFiltros}>
                                    Limpar tudo
                                </button>
                            </div>
                        )}

                        <div className="tabela-pi-scroll">
                            <table className="tabela-pi">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>Nome {sortIcon('name')}</th>
                                        <th>E-mail</th>
                                        <th>Telefone</th>
                                        <th onClick={() => handleSort('gender')} style={{ cursor: 'pointer', userSelect: 'none' }}>Gênero {sortIcon('gender')}</th>
                                        <th onClick={() => handleSort('university')} style={{ cursor: 'pointer', userSelect: 'none' }}>Universidade {sortIcon('university')}</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>Carregando...</td></tr>
                                    ) : error ? (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-error)', padding: 24 }}>{error}</td></tr>
                                    ) : currentAuthors.length === 0 ? (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>Nenhum autor encontrado</td></tr>
                                    ) : currentAuthors.map(author => (
                                        <tr key={author.id}>
                                            <td style={{ color: 'var(--color-text)', fontWeight: 500 }}>{author.name}</td>
                                            <td>{author.email}</td>
                                            <td>{formatPhone(author.phone)}</td>
                                            <td>{author.gender || '—'}</td>
                                            <td>{author.university || '—'}</td>
                                            <td>
                                                <div className="tabela-pi-acoes">
                                                    <button onClick={() => handleOpenViewModal(author)} className="btn-acao" title="Visualizar"><Eye size={18} /></button>
                                                    <button onClick={() => handleOpenUpdateModal(author)} className="btn-acao" title="Editar"><Pencil size={18} /></button>
                                                    <button onClick={() => handleOpenDeleteModal(author)} className="btn-acao" title="Excluir" style={{ color: 'var(--color-error)' }}><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {total > PAGE_SIZE && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, fontSize: 14, flexWrap: 'wrap', gap: 12 }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>
                                    Exibindo {indexOfFirstAuthor + 1}–{indexOfLastAuthor} de {total} autores
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

            {/* Modal de EDIÇÃO */}
            {showUpdateModal && selectedAuthor && (
                <UpdateAuthorModal
                    onClose={handleCloseUpdateModal}
                    author={selectedAuthor}
                    onUpdateSuccess={handleUpdateSuccess}
                />
            )}

            {/* Modal de filtros */}
            {showFilterModal && (
                <FilterAuthorModal
                    onClose={handleCloseFilterModal}
                    onApplyFilters={handleApplyFilters}
                    currentFilters={filters}
                />
            )}

            {/* Modal de confirmação de exclusão */}
            {showDeleteModal && authorToDelete && (
                <ConfirmDeleteModal
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleDeleteAuthor}
                    authorName={authorToDelete.name}
                />
            )}

            <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

        </div>
    );
}
