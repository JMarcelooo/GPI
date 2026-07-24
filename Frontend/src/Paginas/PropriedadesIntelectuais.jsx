import React, { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./PI.css";
import "../Tela2.css";

function PropriedadesIntelectuais() {
  const navigate = useNavigate();
  const [pis, setPis] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="container">
      <div className="sidebar">
        <img src="imagens/Sistema-Logo.png" alt="UERN inova" width="150" />
        <nav className="nav">
          <button onClick={() => navigate("/dashboard")}>Inicio</button>
          <button onClick={() => navigate("/propriedade-intelectual")}>Propriedades Intelectuais</button>
          <button onClick={() => navigate("/autores")}>Autores</button>
          <button onClick={() => navigate("/pagamentos")}>Pagamentos</button>
          <button>Configurações</button>
        </nav>
        <img src="imagens/Inova-Rodape.png" alt="Rodapé" width="150" />
      </div>

      <div className="main">
        <div className="container-pi">
          <div className="conteudo-pi">
            <h2>Propriedades Intelectuais</h2>

            <div className="filtros-topo">
              <input type="text" placeholder="Buscar por nome, tipo, autor ou protocolo" />
              <button className="btn-filtro">Filtros</button>
              <button className="btn-novo-pi" onClick={() => navigate("/cadastro-pi")}>
                + Cadastrar Nova PI
              </button>
            </div>

            <table className="tabela-pi">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Protocolo</th>
                  <th>Data de Registro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6">Carregando...</td></tr>
                ) : pis.length === 0 ? (
                  <tr><td colSpan="6">Nenhuma PI cadastrada</td></tr>
                ) : (
                  pis.map(pi => (
                    <tr key={pi.id}>
                      <td>{String(pi.id).padStart(2, "0")}</td>
                      <td>{pi.titulo}</td>
                      <td><span className={`badge ${pi.status}`}>{pi.status}</span></td>
                      <td>{pi.protocolo || "-"}</td>
                      <td>{pi.createdAt ? new Date(pi.createdAt).toLocaleDateString("pt-BR") : "-"}</td>
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
