import React, { useState, useEffect } from 'react';
import { Plus, X, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import RegisterAuthorModal from '../Components/RegisterAuthorModal';
import './Detalhe1.css';

const TIPOS_PI = [
  'patente de invencao',
  'modelo de utilidade',
  'marca',
  'programa de computador'
];

const STATUS_PI = [
  'indeferida',
  'anulada',
  'arquivada',
  'em analise',
  'deferida',
  'registrada',
  'carta patente'
];

export default function CadastroPI() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titulo: '',
    depositante: '',
    parceiro: '',
    titular: '',
    status: 'em analise',
    protocolo: '',
    data_entrada: '',
    ano: new Date().getFullYear(),
    termo_cessao: false
  });
  const [autoresDisponiveis, setAutoresDisponiveis] = useState([]);
  const [autoresSelecionados, setAutoresSelecionados] = useState([]);
  const [showRegisterAuthorModal, setShowRegisterAuthorModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/autores`)
      .then(res => setAutoresDisponiveis(res.data.data || []))
      .catch(err => console.error("Erro ao buscar autores:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRegisterAuthorSuccess = async (newAuthorData) => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/autores`, newAuthorData);
    const created = response.data.data;
    setAutoresDisponiveis(prev => [...prev, created]);
    setAutoresSelecionados(prev => [...prev, created.id]);
    setShowRegisterAuthorModal(false);
  };

  const toggleAutor = (autorId) => {
    setAutoresSelecionados(prev =>
      prev.includes(autorId)
        ? prev.filter(id => id !== autorId)
        : [...prev, autorId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/pi`, {
        ...form,
        ano: form.ano ? Number(form.ano) : null,
        data_entrada: form.data_entrada || null,
        autores: autoresSelecionados
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
      <main style={{ flex: 1, backgroundColor: "#f3f4f6", padding: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: "none", border: "none", fontSize: "18px", cursor: "pointer",
                padding: "8px", borderRadius: "5px", transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.target.style.background = "#E5E7EB")}
              onMouseLeave={e => (e.target.style.background = "none")}
            >
              ←
            </button>
            <h2 style={{ fontSize: "20px", color: "#6B21A8" }}>Cadastro de Propriedade Intelectual</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card-form-section">
            <h3 className="section-title">Informações principais</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="titulo">Tipo</label>
                <select id="titulo" name="titulo" value={form.titulo} onChange={handleChange} required>
                  <option value="">Selecione</option>
                  {TIPOS_PI.map(t => (
                    <option key={t} value={t}>{t.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={form.status} onChange={handleChange}>
                  {STATUS_PI.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="protocolo">Protocolo</label>
                <input type="text" id="protocolo" name="protocolo" value={form.protocolo} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="depositante">Depositante</label>
                <input type="text" id="depositante" name="depositante" value={form.depositante} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="parceiro">Parceiro</label>
                <input type="text" id="parceiro" name="parceiro" value={form.parceiro} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="titular">Titular</label>
                <input type="text" id="titular" name="titular" value={form.titular} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="data_entrada">Data de Entrada</label>
                <input type="date" id="data_entrada" name="data_entrada" value={form.data_entrada} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="ano">Ano</label>
                <input type="number" id="ano" name="ano" value={form.ano} onChange={handleChange} min="1900" max="2100" />
              </div>
              <div className="form-group">
                <label htmlFor="termo_cessao">Termo de Cessão</label>
                <select id="termo_cessao" name="termo_cessao" value={form.termo_cessao} onChange={e => setForm(prev => ({ ...prev, termo_cessao: e.target.value === 'true' }))}>
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card-form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="section-title" style={{ margin: 0 }}>Autores</h3>
              <button
                type="button"
                onClick={() => setShowRegisterAuthorModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: '#7C3AED', color: '#fff', border: 'none',
                  padding: '8px 16px', borderRadius: '8px', fontSize: '0.875rem',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                <UserPlus size={16} /> Adicionar Autor
              </button>
            </div>
            {autoresDisponiveis.length === 0 ? (
              <p style={{ color: '#888', fontSize: '0.875rem' }}>Nenhum autor encontrado. Cadastre autores primeiro.</p>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)' }}>
                {autoresDisponiveis.map(autor => (
                  <label key={autor.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', cursor: 'pointer', borderRadius: '4px' }}>
                    <input
                      type="checkbox"
                      checked={autoresSelecionados.includes(autor.id)}
                      onChange={() => toggleAutor(autor.id)}
                    />
                    <span>{autor.name}</span>
                    <span style={{ color: '#888', fontSize: '0.75rem' }}>({autor.email})</span>
                  </label>
                ))}
              </div>
            )}
            {autoresSelecionados.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                {autoresSelecionados.map(id => {
                  const autor = autoresDisponiveis.find(a => a.id === id);
                  if (!autor) return null;
                  return (
                    <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EDE9FE', color: '#7C3AED', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {autor.name}
                      <X size={14} style={{ cursor: 'pointer' }} onClick={() => toggleAutor(id)} />
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
            <button type="button" className="cancel-button" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="submit-button" disabled={submitting}>{submitting ? "Salvando..." : "Cadastrar PI"}</button>
          </div>
        </form>
      </main>

      {showRegisterAuthorModal && (
        <RegisterAuthorModal
          onClose={() => setShowRegisterAuthorModal(false)}
          onRegisterSuccess={handleRegisterAuthorSuccess}
        />
      )}
    </div>
  );
}
