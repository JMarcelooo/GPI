import React, { useState, useEffect } from "react";
import { Eye, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from '../Components/Sidebar';
import "./PI.css";
import "../Tela2.css";
import { formatDate, formatStatus } from '../utils/formatDate';
import Toast from '../Components/Toast';

function normalizeStatus(status) {
  return status.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
}

function PropriedadesIntelectuais() {
  const navigate = useNavigate();
  const [pis, setPis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [piToDelete, setPiToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pisPerPage = 10;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/pi`)
      .then(res => {
        setPis(res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar PIs:", err);
        setLoading(false);
      });
  }, []);

  const handleDeletePI = async () => {
    if (!piToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/pi/${piToDelete.id}`);
      setPis(prev => prev.filter(p => p.id !== piToDelete.id));
      setPiToDelete(null);
      setToast({ message: 'PI excluída com sucesso!', type: 'success' });
    } catch (err) {
      console.error("Erro ao deletar PI:", err);
      setToast({ message: 'Erro ao excluir PI.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filtroStatus, filtroTipo]);

  const sortedPIs = (() => {
    let list = pis.filter(pi => {
      const matchSearch = !searchTerm || (
        pi.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pi.depositante.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pi.parceiro && pi.parceiro.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      const matchStatus = !filtroStatus || pi.status === filtroStatus;
            const matchTipo = !filtroTipo || pi.tipo === filtroTipo;
      return matchSearch && matchStatus && matchTipo;
    });
    if (sortField) {
      list.sort((a, b) => {
        const valA = (a[sortField] || '').toString().toLowerCase();
        const valB = (b[sortField] || '').toString().toLowerCase();
        const cmp = valA.localeCompare(valB);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  })();

  const filteredPIs = sortedPIs;
  const indexOfLastPI = currentPage * pisPerPage;
  const indexOfFirstPI = indexOfLastPI - pisPerPage;
  const currentPIs = filteredPIs.slice(indexOfFirstPI, indexOfLastPI);
  const totalPages = Math.ceil(filteredPIs.length / pisPerPage);

  const paginate = (page) => setCurrentPage(page);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

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
                placeholder="Buscar por protocolo, depositante ou parceiro..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.875rem" }}
              >
                <option value="">Todos os tipos</option>
                <option value="patente de invencao">Patente de Invenção</option>
                <option value="modelo de utilidade">Modelo de Utilidade</option>
                <option value="marca">Marca</option>
                <option value="programa de computador">Programa de Computador</option>
              </select>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.875rem" }}
              >
                <option value="">Todos os status</option>
                <option value="indeferida">Indeferida</option>
                <option value="anulada">Anulada</option>
                <option value="arquivada">Arquivada</option>
                <option value="em analise">Em Análise</option>
                <option value="deferida">Deferida</option>
                <option value="registrada">Registrada</option>
                <option value="carta patente">Carta Patente</option>
              </select>
              <button className="btn-novo-pi" onClick={() => navigate("/cadastro-pi")}>
                + Cadastrar Nova PI
              </button>
            </div>

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
                ) : filteredPIs.length === 0 ? (
                  <tr><td colSpan="7">Nenhuma PI cadastrada</td></tr>
                ) : (
                  currentPIs.map(pi => (
                    <tr key={pi.id}>
                      <td style={{ textTransform: 'capitalize' }}>{pi.tipo}</td>
                      <td>{pi.titulo || "-"}</td>
                      <td>
                        <span className={`badge ${normalizeStatus(pi.status)}`}>
                          {formatStatus(pi.status)}
                        </span>
                      </td>
                      <td>{pi.protocolo || "-"}</td>
                      <td>{pi.depositante || "-"}</td>
                      <td>{formatDate(pi.data_entrada)}</td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => navigate(`/detalhes/${pi.id}`)} className="btn-acao" title="Visualizar"><Eye size={18} /></button>
                        <button onClick={() => navigate(`/editar-pi/${pi.id}`)} className="btn-acao" title="Editar"><Pencil size={18} /></button>
                        <button onClick={() => setPiToDelete(pi)} className="btn-acao" title="Excluir" style={{ color: '#EF4444' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {filteredPIs.length > pisPerPage && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 20, fontSize: 14
              }}>
                <span style={{ color: '#64748B' }}>
                  Exibindo {indexOfFirstPI + 1}–{Math.min(indexOfLastPI, filteredPIs.length)} de {filteredPIs.length} PIs
                </span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0',
                      background: currentPage === 1 ? '#F1F5F9' : '#fff',
                      color: currentPage === 1 ? '#94A3B8' : '#475569',
                      fontWeight: 600, fontSize: 13, cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >Anterior</button>
                  {pageNumbers.map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      style={{
                        padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
                        background: currentPage === number ? '#6B21A8' : '#fff',
                        color: currentPage === number ? '#fff' : '#475569',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer', minWidth: 36
                      }}
                    >{number}</button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0',
                      background: currentPage === totalPages ? '#F1F5F9' : '#fff',
                      color: currentPage === totalPages ? '#94A3B8' : '#475569',
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
      {piToDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => !deleting && setPiToDelete(null)}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 32, maxWidth: 420,
            width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', color: '#1E293B', fontSize: 18 }}>Confirmar exclusão</h3>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.5 }}>
              Tem certeza que deseja excluir a PI <strong>{piToDelete.protocolo}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setPiToDelete(null)}
                disabled={deleting}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid #E2E8F0',
                  background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer'
                }}
              >Cancelar</button>
              <button
                onClick={handleDeletePI}
                disabled={deleting}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: '#EF4444', color: '#fff', fontSize: 14, fontWeight: 600,
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
