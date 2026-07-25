import React, { useState, useEffect } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from '../Components/Sidebar';
import "./PI.css";
import "../Tela2.css";

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
    } catch (err) {
      console.error("Erro ao deletar PI:", err);
      alert("Erro ao deletar PI.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredPIs = pis.filter(pi => {
    const matchSearch = !searchTerm || (
      pi.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pi.depositante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pi.parceiro && pi.parceiro.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const matchStatus = !filtroStatus || pi.status === filtroStatus;
    const matchTipo = !filtroTipo || pi.titulo === filtroTipo;
    return matchSearch && matchStatus && matchTipo;
  });

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
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Protocolo</th>
                  <th>Depositante</th>
                  <th>Data de Entrada</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6">Carregando...</td></tr>
                ) : filteredPIs.length === 0 ? (
                  <tr><td colSpan="6">Nenhuma PI cadastrada</td></tr>
                ) : (
                  filteredPIs.map(pi => (
                    <tr key={pi.id}>
                      <td style={{ textTransform: 'capitalize' }}>{pi.titulo}</td>
                      <td>
                        <span className={`badge ${normalizeStatus(pi.status)}`}>
                          {pi.status}
                        </span>
                      </td>
                      <td>{pi.protocolo || "-"}</td>
                      <td>{pi.depositante || "-"}</td>
                      <td>{pi.data_entrada ? new Date(pi.data_entrada + 'T00:00:00').toLocaleDateString("pt-BR") : "-"}</td>
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
          </div>
        </div>
      </div>
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
