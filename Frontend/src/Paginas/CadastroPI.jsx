import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import './Detalhe1.css';

export default function CadastroPI() {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [status, setStatus] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [tipo, setTipo] = useState('');
  const [termoCessao, setTermoCessao] = useState('');
  const [sei, setSei] = useState('');
  const [autores, setAutores] = useState(['']);
  const [submitting, setSubmitting] = useState(false);

  const handleAddAutor = () => {
    setAutores([...autores, '']);
  };

  const handleAutorChange = (index, value) => {
    const newAutores = [...autores];
    newAutores[index] = value;
    setAutores(newAutores);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/pi`, {
        titulo, status, protocolo, data_entrada: dataEntrada, tipo_pi: tipo,
        termo_de_cessao: termoCessao === 'Sim', sei, autores: autores.filter(Boolean)
      });
      navigate('/propriedade-intelectual');
    } catch (err) {
      console.error("Erro ao cadastrar PI:", err);
      alert("Erro ao cadastrar PI. Verifique os dados e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <Sidebar />

      {/* Main Content - Tela de Cadastro */}
      <main style={{ flex: 1, backgroundColor: "#f3f4f6", padding: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => navigate(-1)} // Volta para a tela anterior
              style={{
                background: "none", border: "none", fontSize: "18px", cursor: "pointer",
                padding: "8px", borderRadius: "5px", transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.target.style.background = "#E5E7EB")}
              onMouseLeave={e => (e.target.style.background = "none")}
            >
              ←
            </button>
            <h2 style={{ fontSize: "20px", color: "#6B21A8" }}>Cadastro de Inovação</h2>
          </div>
          {/* Pode adicionar botões de ação aqui, como Salvar */}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Informações Principais */}
          <div className="card-form-section"> {/* Usando uma classe genérica para seções de cards */}
            <h3 className="section-title">Informações principais</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="titulo">Título</label>
                <input type="text" id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="Arquivada">Arquivada</option>
                  <option value="Em Análise">Em Análise</option>
                  {/* Adicione mais opções conforme necessário */}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="protocolo">Protocolo</label>
                <input type="text" id="protocolo" value={protocolo} onChange={(e) => setProtocolo(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="dataEntrada">Data de Entrada</label>
                <input type="date" id="dataEntrada" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="tipo">Tipo</label>
                <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="Patente de Invenção">PATENTE DE INVENÇÃO</option>
                  <option value="Modelo de Utilidade">MODELO DE UTILIDADE</option>
                  {/* Adicione mais opções */}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="termoCessao">Termo de Cessão</label>
                <select id="termoCessao" value={termoCessao} onChange={(e) => setTermoCessao(e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="sei">SEI</label>
                <input type="text" id="sei" value={sei} onChange={(e) => setSei(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Seção Autores */}
          <div className="card-form-section" style={{ marginTop: '20px' }}>
            <h3 className="section-title">Autores</h3>
            {autores.map((autor, index) => (
              <div key={index} className="form-group form-group-inline"> {/* Nova classe para alinhar botão */}
                <label htmlFor={`autor-${index}`}>Nome do Autor</label>
                <input
                  type="text"
                  id={`autor-${index}`}
                  value={autor}
                  onChange={(e) => handleAutorChange(index, e.target.value)}
                />
                {/* Botão de adicionar autor, só aparece no último campo */}
                {index === autores.length - 1 && (
                  <button type="button" className="add-author-button" onClick={handleAddAutor}>
                    <Plus size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Botões de Ação do Formulário */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
            <button type="button" className="cancel-button" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="submit-button" disabled={submitting}>{submitting ? "Salvando..." : "Cadastrar PI"}</button>
          </div>
        </form>
      </main>
    </div>
  );
}