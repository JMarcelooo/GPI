import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import RegisterAuthorModal from '../Components/RegisterAuthorModal';
import Toast from '../Components/Toast';
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

export default function EditarPI() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    tipo: '',
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
  const [searchAutor, setSearchAutor] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${process.env.REACT_APP_API_URL}/api/autores`),
      axios.get(`${process.env.REACT_APP_API_URL}/api/pi/${id}`)
    ])
      .then(([autoresRes, piRes]) => {
        setAutoresDisponiveis(autoresRes.data.data || []);
        const pi = piRes.data.data;
        setForm({
          tipo: pi.tipo || '',
          titulo: pi.titulo || '',
          depositante: pi.depositante || '',
          parceiro: pi.parceiro || '',
          titular: pi.titular || '',
          status: pi.status || 'em analise',
          protocolo: pi.protocolo || '',
          data_entrada: pi.data_entrada || '',
          ano: pi.ano || new Date().getFullYear(),
          termo_cessao: pi.termo_cessao || false
        });
        if (pi.autores && Array.isArray(pi.autores)) {
          setAutoresSelecionados(pi.autores.map(a => a.id));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar dados:", err);
        setLoading(false);
      });
  }, [id]);

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

  const autoresFiltrados = autoresDisponiveis.filter(a =>
    !autoresSelecionados.includes(a.id) &&
    (a.name.toLowerCase().includes(searchAutor.toLowerCase()) ||
     (a.email && a.email.toLowerCase().includes(searchAutor.toLowerCase())))
  );

  const adicionarAutorNaLista = (autor) => {
    setAutoresSelecionados(prev => [...prev, autor.id]);
    setSearchAutor('');
    setShowDropdown(false);
    searchRef.current?.focus();
  };

  const removerAutorDaLista = (autorId) => {
    setAutoresSelecionados(prev => prev.filter(a => a !== autorId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.data_entrada && isNaN(new Date(form.data_entrada).getTime())) {
      setToast({ message: 'Data de entrada inválida.', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/pi/${id}`, {
        ...form,
        ano: form.ano ? Number(form.ano) : null,
        data_entrada: form.data_entrada || null,
        autores: autoresSelecionados
      });
      setToast({ message: 'PI atualizada com sucesso!', type: 'success' });
      setTimeout(() => navigate('/propriedade-intelectual'), 1200);
    } catch (err) {
      console.error("Erro ao atualizar PI:", err);
      const data = err.response?.data;
      let msg = 'Erro ao atualizar PI. Verifique os dados.';
      if (data?.errors && Array.isArray(data.errors)) {
        msg = data.errors.join('. ');
      } else if (data?.error) {
        msg = data.error;
      } else if (!err.response) {
        msg = 'Erro de conexão com o servidor.';
      }
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <Sidebar />
        <main style={{ flex: 1, backgroundColor: "#f3f4f6", padding: "30px" }}>
          Carregando...
        </main>
      </div>
    );
  }

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
            <h2 style={{ fontSize: "20px", color: "#6B21A8" }}>Editar Propriedade Intelectual</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card-form-section">
            <h3 className="section-title">Informações principais</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="tipo">Tipo</label>
                <select id="tipo" name="tipo" value={form.tipo} onChange={handleChange} required>
                  <option value="">Selecione</option>
                  {TIPOS_PI.map(t => (
                    <option key={t} value={t}>{t.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="titulo">Título</label>
                <input type="text" id="titulo" name="titulo" value={form.titulo} onChange={handleChange} placeholder="Nome da PI" />
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
            <h3 className="section-title">Autores Vinculados</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar autor por nome ou email..."
                  value={searchAutor}
                  onChange={e => { setSearchAutor(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  style={{ width: '100%', padding: '10px 12px', paddingLeft: '36px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                {showDropdown && searchAutor && autoresFiltrados.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--color-border)', borderRadius: '8px', marginTop: '4px', maxHeight: '180px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {autoresFiltrados.map(autor => (
                      <div
                        key={autor.id}
                        onMouseDown={() => adicionarAutorNaLista(autor)}
                        style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>{autor.name}</span>
                        <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{autor.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterAuthorModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                  background: '#7C3AED', color: '#fff', border: 'none',
                  padding: '10px 16px', borderRadius: '8px', fontSize: '0.875rem',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                <UserPlus size={16} /> Adicionar Autor
              </button>
            </div>

            {autoresSelecionados.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {autoresSelecionados.map(id => {
                  const autor = autoresDisponiveis.find(a => a.id === id);
                  if (!autor) return null;
                  return (
                    <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EDE9FE', color: '#7C3AED', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {autor.name}
                      <X size={14} style={{ cursor: 'pointer' }} onClick={() => removerAutorDaLista(id)} />
                    </span>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#888', fontSize: '0.875rem', margin: 0 }}>Nenhum autor selecionado.</p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
            <button type="button" className="cancel-button" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="submit-button" disabled={submitting}>{submitting ? "Salvando..." : "Salvar Alterações"}</button>
          </div>
        </form>
      </main>

      {showRegisterAuthorModal && (
        <RegisterAuthorModal
          onClose={() => setShowRegisterAuthorModal(false)}
          onRegisterSuccess={handleRegisterAuthorSuccess}
        />
      )}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
