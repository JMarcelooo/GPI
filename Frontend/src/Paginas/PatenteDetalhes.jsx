import React, { useState, useEffect } from "react";
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdicionarRPIModal from '../Components/AdicionarRPIModal';
import axios from 'axios';
import './Detalhe1.css';

export default function PatenteDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [pi, setPi] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [rpiEvents, setRpiEvents] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/pi/${id}`)
      .then(res => setPi(res.data.data))
      .catch(err => console.error("Erro ao buscar PI:", err));
  }, [id]);

  const handleAddRPI = (newRPI) => {
    setRpiEvents(prev => [...prev, newRPI]);
  };

  if (!pi) return <div className="container"><main style={{ flex: 1, padding: 30 }}>Carregando...</main></div>;

  return (
    <div className="container">
      <div className="sidebar">
        <img src="imagens/Sistema-Logo.png" alt="UERN inova" width="150" />
        <nav className="nav">
          <button onClick={() => navigate("/dashboard")}>Inicio</button>
          <button onClick={() => navigate("/propriedade-intelectual")}>Propriedades Intelectuais</button>
          <button>Autores</button>
          <button>Configurações</button>
        </nav>
        <img src="imagens/Inova-Rodape.png" alt="Rodapé" width="150" />
      </div>

      <main style={{ flex: 1, backgroundColor: "white", padding: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "5px", display: "flex", alignItems: "center" }}><ArrowLeft size={20} /></button>
            <h2 style={{ fontSize: "20px", color: "#6B21A8" }}>Detalhes da Propriedades Intelectuais</h2>
          </div>
        </div>

        <div style={{ marginBottom: "10px" }}><strong>Protocolo:</strong> {pi.protocolo || "-"}</div>

        <div style={{ marginBottom: "30px" }}>
          <button onClick={() => setActiveTab('geral')} style={{ padding: "10px", borderRadius: "5px", backgroundColor: activeTab === 'geral' ? "white" : "#7E22CE", color: activeTab === 'geral' ? "#6B21A8" : "white", fontWeight: activeTab === 'geral' ? "bold" : "normal", border: "none", cursor: "pointer", marginRight: 10 }}>Informações gerais</button>
          <button onClick={() => setActiveTab('historico')} style={{ padding: "10px", borderRadius: "5px", backgroundColor: activeTab === 'historico' ? "white" : "#7E22CE", color: activeTab === 'historico' ? "#6B21A8" : "white", fontWeight: activeTab === 'historico' ? "bold" : "normal", border: "none", cursor: "pointer" }}>Histórico</button>
        </div>

        {activeTab === 'geral' && (
          <>
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", marginBottom: "30px" }}>
              <h3 style={{ color: "#6B21A8", marginBottom: "15px" }}>Informações principais</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "14px" }}>
                <div><strong>Título:</strong><br />{pi.titulo}</div>
                <div><strong>Status:</strong><br />{pi.status}</div>
                <div><strong>Protocolo:</strong><br />{pi.protocolo || "-"}</div>
                <div><strong>Data de Criação:</strong><br />{pi.createdAt ? new Date(pi.createdAt).toLocaleDateString("pt-BR") : "-"}</div>
              </div>
            </div>

            <div className="patente-detalhes-container">
              <div className="header">
                <div className="title-section">
                  <h1>Informações de RPI</h1>
                </div>
                <button className="add-rpi-button" onClick={() => setIsModalOpen(true)}>+ Adicionar RPI</button>
              </div>

              {rpiEvents.length === 0 ? (
                <p style={{ padding: 16, color: '#888' }}>Nenhum evento RPI registrado</p>
              ) : (
                <div className="rpi-events-grid">
                  {rpiEvents.map((event, index) => (
                    <div key={index} className="rpi-card">
                      <div className="card-header">
                        <span>{event.date} - {event.version}</span>
                      </div>
                      <p>{event.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'historico' && (
          <div className="historico-eventos-container">
            <div className="historico-header">
              <h1>Histórico de Eventos</h1>
            </div>
            <p style={{ padding: 16, color: '#888' }}>Nenhum evento registrado</p>
          </div>
        )}
      </main>

      <AdicionarRPIModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddRPI={handleAddRPI} />
    </div>
  );
}
