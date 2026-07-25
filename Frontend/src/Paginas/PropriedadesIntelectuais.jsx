import React, { useState, useEffect } from "react";
import { Eye, Search, SlidersHorizontal } from "lucide-react";
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
                  <th>ID</th>
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
                  <tr><td colSpan="7">Carregando...</td></tr>
                ) : filteredPIs.length === 0 ? (
                  <tr><td colSpan="7">Nenhuma PI cadastrada</td></tr>
                ) : (
                  filteredPIs.map(pi => (
                    <tr key={pi.id}>
                      <td>{String(pi.id).padStart(2, "0")}</td>
                      <td style={{ textTransform: 'capitalize' }}>{pi.titulo}</td>
                      <td>
                        <span className={`badge ${normalizeStatus(pi.status)}`}>
                          {pi.status}
                        </span>
                      </td>
                      <td>{pi.protocolo || "-"}</td>
                      <td>{pi.depositante || "-"}</td>
                      <td>{pi.data_entrada ? new Date(pi.data_entrada + 'T00:00:00').toLocaleDateString("pt-BR") : "-"}</td>
                      <td>
                        <button onClick={() => navigate(`/detalhes/${pi.id}`)} className="btn-acao"><Eye size={18} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropriedadesIntelectuais;
