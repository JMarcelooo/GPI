import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Pencil, Trash2, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import RegisterAuthorModal from '../Components/RegisterAuthorModal';
import UpdateAuthorModal from '../Components/UpdateAuthorModal';
import FilterAuthorModal from '../Components/FilterAuthorModal';
import ConfirmDeleteModal from '../Components/ConfirmDeleteModal';
import axios from 'axios';
import './Autor.css';

const API = process.env.REACT_APP_API_URL;
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

export default function Autor() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [authors, setAuthors] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [authorToDelete, setAuthorToDelete] = useState(null);
    const [filters, setFilters] = useState({});
    const [sortField, setSortField] = useState(null);
    const [sortDir, setSortDir] = useState('asc');

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
      } catch (error) {
        console.error("Erro ao buscar autores:", error);
        setAuthors([]);
        setTotal(0);
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

    // Funções para abrir/fechar modais
    const handleCloseRegisterModal = () => setShowRegisterModal(false);
    const handleOpenFilterModal = () => setShowFilterModal(true);
    const handleCloseFilterModal = () => setShowFilterModal(false);
    const handleApplyFilters = (newFilters) => {
      setFilters(newFilters);
      setCurrentPage(1);
    };

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

    // Funções de callback para quando o modal de cadastro/edição tiver sucesso
    const handleRegisterSuccess = async (newAuthor) => {
    try {
        await axios.post(`${API}/api/autores`, newAuthor);
        setCurrentPage(1);
        loadAuthors(1, searchTerm, filters, sortField, sortDir);
        handleCloseRegisterModal();
    } catch (error) {
        console.error("Erro ao cadastrar autor:", error);
    }
};

    const handleUpdateSuccess = async (updatedAuthor) => {
    try {
        await axios.put(`${API}/api/autores/${updatedAuthor.id}`, updatedAuthor);
        loadAuthors(currentPage, searchTerm, filters, sortField, sortDir);
        handleCloseUpdateModal();
    } catch (error) {
        console.error("Erro ao atualizar autor:", error);
    }
};

    const handleDeleteAuthor = async () => {
    if (!authorToDelete) return;
    try {
        await axios.delete(`${API}/api/autores/${authorToDelete.id}`);
        handleCloseDeleteModal();
        if (authors.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          loadAuthors(currentPage, searchTerm, filters, sortField, sortDir);
        }
    } catch (error) {
        console.error("Erro ao deletar autor:", error);
    }
};


    return (
        <div className="authors-container">
            <Sidebar />
            <div className="authors-content">
                <h1 className="authors-title">Autores</h1>

                {/* Header com busca e botões */}
                <div className="authors-header">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Buscar por nome, sobrenome, instituição, etc."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="header-buttons">
                        <button className="filter-button" onClick={handleOpenFilterModal}>
                            <SlidersHorizontal size={16} className="filter-icon" /> Filtros
                        </button>

                    </div>
                </div>

                {/* Tabela de Autores */}
                <div className="authors-table-wrapper">
                    <table className="authors-table">
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
                                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#64748B', padding: 24 }}>Carregando...</td></tr>
                            ) : currentAuthors.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#64748B', padding: 24 }}>Nenhum autor encontrado</td></tr>
                            ) : currentAuthors.map(author => (
                                <tr key={author.id}>
                                    <td>{author.name}</td>
                                    <td>{author.email}</td>
                                    <td>{formatPhone(author.phone)}</td>
                                    <td>{author.gender}</td>
                                    <td>{author.university}</td>
                                    <td>
                                        <button className="edit-author-button" onClick={() => handleOpenViewModal(author)} title="Visualizar">
                                            <Eye size={16} />
                                        </button>
                                        <button className="edit-author-button" onClick={() => handleOpenUpdateModal(author)} style={{ marginLeft: 4 }} title="Editar">
                                            <Pencil size={16} />
                                        </button>
                                        <button className="delete-author-button" onClick={() => handleOpenDeleteModal(author)} style={{ marginLeft: 4 }} title="Excluir">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                {total > PAGE_SIZE && (
                <div className="authors-pagination">
                    <span className="pagination-info">
                        Exibindo {indexOfFirstAuthor + 1} a {indexOfLastAuthor} de {total} autores
                    </span>
                    <div className="pagination-controls">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="pagination-button"
                        >
                            Anterior
                        </button>
                        {pageNumbers.map(number => (
                            <button
                                key={number}
                                onClick={() => paginate(number)}
                                className={`pagination-button ${currentPage === number ? 'active' : ''}`}
                            >
                                {number}
                            </button>
                        ))}
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="pagination-button"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
                )}
            </div>

            {/* Renderizar o modal de CADASTRO apenas se showRegisterModal for true */}
            {showRegisterModal && (
                <RegisterAuthorModal
                    onClose={handleCloseRegisterModal}
                    onRegisterSuccess={handleRegisterSuccess}
                />
            )}

            {/* Renderizar o modal de EDIÇÃO apenas se showUpdateModal for true e um autor estiver selecionado */}
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

        </div>
    );
}
