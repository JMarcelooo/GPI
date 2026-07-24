import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Pencil, Trash2 } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import RegisterAuthorModal from '../Components/RegisterAuthorModal';
import UpdateAuthorModal from '../Components/UpdateAuthorModal';
import FilterAuthorModal from '../Components/FilterAuthorModal';
import axios from 'axios';
import './Autor.css';

export default function Autor() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const authorsPerPage = 4;

    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [filters, setFilters] = useState({});

    const [allAuthors, setAllAuthors] = useState([]);
   useEffect(() => {
  axios.get(`${process.env.REACT_APP_API_URL}/api/autores`)
    .then((response) => {
      setAllAuthors(response.data.data);
    })
    .catch((error) => {
      console.error("Erro ao buscar autores:", error);
    });
}, []);

    // Aplica busca textual + filtros
    const filteredAuthors = allAuthors.filter(author => {
    const matchesSearch = !searchTerm || (
      (author.name && author.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (author.email && author.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (author.university && author.university.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const matchesFilters = Object.entries(filters).every(([key, value]) =>
      author[key] && author[key].toLowerCase() === value.toLowerCase()
    );

    return matchesSearch && matchesFilters;
});


    // Lógica de paginação
    const indexOfLastAuthor = currentPage * authorsPerPage;
    const indexOfFirstAuthor = indexOfLastAuthor - authorsPerPage;
    const currentAuthors = filteredAuthors.slice(indexOfFirstAuthor, indexOfLastAuthor);
    const totalPages = Math.ceil(filteredAuthors.length / authorsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    // Funções para abrir/fechar modais
    const handleOpenRegisterModal = () => setShowRegisterModal(true);
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

    // Funções de callback para quando o modal de cadastro/edição tiver sucesso
    const handleRegisterSuccess = async (newAuthor) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/autores`, newAuthor);
        setAllAuthors([...allAuthors, response.data.data]);
        setCurrentPage(1);
    } catch (error) {
        console.error("Erro ao cadastrar autor:", error);
    }
};

    const handleUpdateSuccess = async (updatedAuthor) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/autores/${updatedAuthor.id}`, updatedAuthor);
        setAllAuthors(allAuthors.map(author =>
            author.id === updatedAuthor.id ? response.data.data : author
        ));
    } catch (error) {
        console.error("Erro ao atualizar autor:", error);
    }
};

    const handleDeleteAuthor = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este autor?")) return;
    try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/autores/${id}`);
        setAllAuthors(allAuthors.filter(author => author.id !== id));
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
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="header-buttons">
                        <button className="filter-button" onClick={handleOpenFilterModal}>
                            <SlidersHorizontal size={16} className="filter-icon" /> Filtros
                        </button>
                        {/* Botão para abrir o modal de CADASTRO */}
                        <button className="add-author-button" onClick={handleOpenRegisterModal}>
                            <span className="plus-icon">+</span> Cadastrar Autor
                        </button>
                    </div>
                </div>

                {/* Tabela de Autores */}
                <div className="authors-table-wrapper">
                    <table className="authors-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th>Gênero</th>
                                <th>Universidade</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentAuthors.map(author => (
                                <tr key={author.id}>
                                    <td>{author.id}</td>
                                    <td>{author.name}</td>
                                    <td>{author.email}</td>
                                    <td>{author.gender}</td>
                                    <td>{author.university}</td>
                                    <td>
                                        <button className="edit-author-button" onClick={() => handleOpenUpdateModal(author)}>
                                            <Pencil size={16} />
                                        </button>
                                        <button className="delete-author-button" onClick={() => handleDeleteAuthor(author.id)} style={{ marginLeft: 8 }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                <div className="authors-pagination">
                    <span className="pagination-info">
                        Exibindo {indexOfFirstAuthor + 1} de {Math.min(indexOfLastAuthor, filteredAuthors.length)} de {filteredAuthors.length} autores
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
        </div>
    );
}