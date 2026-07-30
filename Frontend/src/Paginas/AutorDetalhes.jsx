import { useState, useEffect } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import axios from 'axios';
import './Detalhe1.css';
import { formatStatus, formatTipo } from '../utils/formatDate';

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

const genderLabel = (g) => {
  if (g === 'Nao informado') return 'Não informado';
  return g;
};

export default function AutorDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [autor, setAutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const api = process.env.REACT_APP_API_URL;
    axios.get(`${api}/api/autores/${id}`)
      .then(res => {
        setAutor(res.data.data);
        setError(null);
      })
      .catch(err => {
        console.error("Erro ao buscar autor:", err);
        setError(err.response?.status === 404 ? 'Autor não encontrado.' : 'Erro ao carregar autor.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const infoItems = [
    { label: 'E-mail', value: autor?.email },
    { label: 'Telefone', value: formatPhone(autor?.phone) },
    { label: 'Gênero', value: genderLabel(autor?.gender) },
    { label: 'Vínculo', value: autor?.bond },
    { label: 'Departamento', value: autor?.department },
    { label: 'Campus', value: autor?.campus },
    { label: 'Universidade', value: autor?.university },
  ];

  if (loading) return (
    <div className="container">
      <Sidebar />
      <main style={{ flex: 1, padding: 30, color: 'var(--color-text-secondary)' }}>Carregando...</main>
    </div>
  );

  if (error) return (
    <div className="container">
      <Sidebar />
      <main style={{ flex: 1, padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{error}</p>
        <button onClick={() => navigate('/autores')} style={{
          background: '#93278F', color: '#fff', border: 'none', padding: '10px 24px',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
        }}>Voltar para lista</button>
      </main>
    </div>
  );

  const associatedPI = autor?.PIs || [];

  return (
    <div className="container">
      <Sidebar />

      <main style={{ flex: 1, backgroundColor: 'var(--color-bg)', overflowY: 'auto' }}>
        <div className="detalhes-header" style={{ padding: '40px 40px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <button onClick={() => navigate(-1)} style={{
              background: 'rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer',
              padding: '8px 12px', borderRadius: 8, display: 'inline-flex',
              alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 500,
            }}>
              <ArrowLeft size={16} /> Voltar
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate(`/autores/editar/${id}`)} style={{
                background: 'rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer',
                padding: '8px 14px', borderRadius: 8, display: 'inline-flex',
                alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 500,
              }}>
                <Pencil size={14} /> Editar
              </button>
            </div>
          </div>

          <h1 style={{
            fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 0 6px',
            letterSpacing: '-0.5px', lineHeight: 1.2
          }}>
            {autor.name}
          </h1>

          <div className="modal-view-chips" style={{ marginTop: 16 }}>
            {infoItems.map(({ label, value }) => (
              <span key={label} className="modal-view-chip">
                <strong>{label}:</strong>
                {value || '-'}
              </span>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 40px' }}>
          <div style={{
            background: 'var(--color-surface)', padding: '28px 32px', borderRadius: 12,
            border: '1px solid var(--color-border)', marginBottom: 28
          }}>
            <h3 style={{ color: 'var(--color-primary)', margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>
              Propriedades Intelectuais Vinculadas
            </h3>

            {associatedPI.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                Nenhuma propriedade intelectual vinculada a este autor.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tabela-pi">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Título</th>
                      <th>Protocolo</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {associatedPI.map(pi => (
                      <tr key={pi.id}
                        onClick={() => navigate(`/detalhes/${pi.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{formatTipo(pi.tipo)}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{pi.titulo || '-'}</td>
                        <td>{pi.protocolo}</td>
                        <td>{formatStatus(pi.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
