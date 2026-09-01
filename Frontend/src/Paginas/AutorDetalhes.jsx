import API_URL from '../config';
import { useState, useEffect } from 'react';
import { ArrowLeft, Pencil, Mail, Building2, FileText, Layers } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import UpdateAuthorModal from '../Components/UpdateAuthorModal';
import axios from 'axios';
import './Detalhe1.css';
import './Payments.css';
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
  if (!g || g === 'Nao informado') return 'Não informado';
  return g;
};

export default function AutorDetalhes() {
  document.title = 'GPI - Detalhes do Autor';
  const navigate = useNavigate();
  const { id } = useParams();
  const [autor, setAutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    const api = API_URL;
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

  const handleUpdateSuccess = async (updatedAuthor) => {
    const api = API_URL;
    await axios.put(`${api}/api/autores/${updatedAuthor.id}`, updatedAuthor);
    setAutor(updatedAuthor);
  };

  if (loading) return (
    <div className="payments-page">
      <Sidebar />
      <div className="payments-content" style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-text-secondary)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:36, height:36, border:'3px solid var(--color-border)', borderTopColor:'var(--color-primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
          Carregando autor...
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="payments-page">
      <Sidebar />
      <div className="payments-content" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--color-text-secondary)', textAlign:'center', padding:40 }}>
        <p style={{ fontSize:18, fontWeight:700, marginBottom:12, color:'var(--color-text)' }}>{error}</p>
        <button onClick={() => navigate('/autores')} style={{
          background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '10px 24px',
          borderRadius: 10, fontSize: 13, fontWeight: 650, cursor: 'pointer', boxShadow:'0 4px 12px rgba(147,39,143,0.22)'
        }}>Voltar para lista</button>
      </div>
    </div>
  );

  const associatedPI = autor?.PIs || [];
  const iniciais = (autor?.name || 'A').split(' ').filter(Boolean).slice(0,2).map(s=>s[0]?.toUpperCase()).join('');

  return (
    <div className="payments-page">
      <Sidebar />
      <div className="payments-content anim-rise" style={{ padding:0, overflowY:'auto', background:'var(--color-bg)' }}>
        {/* Header roxo com informações dentro — como era antes, porém organizado */}
        <div style={{
          background: 'var(--sidebar-bg)',
          padding: '28px 32px 24px',
          color:'#fff',
          position:'relative',
          overflow:'hidden'
        }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(600px 220px at 20% 0%, rgba(255,255,255,0.13), transparent 60%)', pointerEvents:'none' }} />
          <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
            <button onClick={() => navigate(-1)} style={{
              background: 'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.14)', cursor:'pointer',
              padding:'8px 14px', borderRadius:10, display:'inline-flex', alignItems:'center', gap:6, color:'#fff', fontSize:13, fontWeight:600,
              backdropFilter:'blur(6px)'
            }}>
              <ArrowLeft size={16} /> Voltar
            </button>
            <button onClick={() => setShowUpdateModal(true)} style={{
              background:'#fff', border:'1px solid rgba(255,255,255,0.9)', cursor:'pointer',
              padding:'8px 14px', borderRadius:10, display:'inline-flex', alignItems:'center', gap:6, color:'var(--sidebar-bg)', fontSize:13, fontWeight:700,
              boxShadow:'0 4px 12px rgba(0,0,0,0.14)'
            }}>
              <Pencil size={14} /> Editar
            </button>
          </div>

          <div style={{ position:'relative', display:'flex', gap:18, alignItems:'center', marginBottom:20 }}>
            <div style={{
              width:64, height:64, borderRadius:14, background:'#fff', color:'var(--sidebar-bg)',
              display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:20,
              boxShadow:'0 8px 24px rgba(0,0,0,0.18)', border:'3px solid rgba(255,255,255,0.9)', flexShrink:0
            }}>
              {iniciais}
            </div>
            <div style={{ minWidth:0, flex:1 }}>
              <h1 style={{ fontSize:26, fontWeight:800, color:'#fff', margin:'0 0 4px', lineHeight:1.2, letterSpacing:'-0.02em' }}>
                {autor.name}
              </h1>
              <p style={{ margin:0, color:'rgba(255,255,255,0.88)', fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Mail size={14} />{autor.email || 'Sem e-mail'}</span>
                {associatedPI.length > 0 && <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', background:'#fff', borderRadius:999, fontSize:11, fontWeight:700, color:'var(--sidebar-bg)' }}><Layers size={12} />{associatedPI.length} PI{associatedPI.length!==1?'s':''}</span>}
              </p>
            </div>
          </div>

          {/* Informações dentro do header — hierarquia corrigida: rótulo > valor, blocos compactos */}
          <div style={{
            position:'relative',
            display:'flex',
            flexDirection:'column',
            gap:14
          }}>
            {/* Bloco Contato — metade da largura para aproximar infos */}
            <div style={{ maxWidth:'50%' }}>
              <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'#fff', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}><Mail size={12}/> Contato</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px, 1fr))', gap:8, alignItems:'start' }}>
                <div>
                  <div style={{ fontSize:13, color:'#fff', fontWeight:700, lineHeight:1.2 }}>E-mail</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.78)', wordBreak:'break-all', lineHeight:1.35 }}>{autor.email || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize:13, color:'#fff', fontWeight:700, lineHeight:1.2 }}>Telefone</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.78)', lineHeight:1.35 }}>{formatPhone(autor.phone) || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize:13, color:'#fff', fontWeight:700, lineHeight:1.2 }}>Gênero</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.78)', lineHeight:1.35 }}>{genderLabel(autor.gender)}</div>
                </div>
              </div>
            </div>

            <div style={{ height:1, background:'rgba(255,255,255,0.12)', margin:'0' }} />

            {/* Bloco Institucional */}
            <div>
              <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'#fff', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}><Building2 size={12}/> Institucional</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:6, alignItems:'start' }}>
                <div>
                  <div style={{ fontSize:13, color:'#fff', fontWeight:700, lineHeight:1.2 }}>Vínculo</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.78)', lineHeight:1.35 }}>{autor.bond || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize:13, color:'#fff', fontWeight:700, lineHeight:1.2 }}>Campus</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.78)', wordBreak:'break-word', lineHeight:1.35 }}>{autor.campus || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize:13, color:'#fff', fontWeight:700, lineHeight:1.2 }}>Departamento</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.78)', wordBreak:'break-word', lineHeight:1.35 }}>{autor.department || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize:13, color:'#fff', fontWeight:700, lineHeight:1.2 }}>Universidade</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.78)', wordBreak:'break-word', lineHeight:1.35 }}>{autor.university || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Apenas PIs abaixo — página mais enxuta, sem redundância */}
        <div style={{ padding:'20px 32px 32px', maxWidth:1100, margin:'0 auto', width:'100%', boxSizing:'border-box' }}>
          <div className="table-section">
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:32, height:32, borderRadius:8, background:'var(--color-primary-bg)', color:'var(--color-primary)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><Layers size={15} /></span>
                <h3 style={{ margin:0, fontSize:13, fontWeight:700, color:'var(--color-text)' }}>Propriedades vinculadas</h3>
              </div>
              <span style={{ padding:'4px 10px', borderRadius:999, background:'var(--color-bg)', border:'1px solid var(--color-border)', fontSize:11, fontWeight:700, color:'var(--color-text-secondary)' }}>{associatedPI.length}</span>
            </div>

            {associatedPI.length === 0 ? (
              <div style={{ padding:'36px 20px', textAlign:'center' }}>
                <div style={{ width:48, height:48, borderRadius:12, background:'var(--color-bg)', border:'1px solid var(--color-border)', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:10, color:'var(--color-text-muted)' }}>
                  <FileText size={18} />
                </div>
                <p style={{ margin:'0 0 4px', fontWeight:650, color:'var(--color-text)', fontSize:13 }}>Nenhuma PI vinculada</p>
                <p style={{ margin:0, fontSize:12, color:'var(--color-text-muted)' }}>Este autor ainda não está associado a nenhuma propriedade intelectual.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="payments-table">
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
                      <tr key={pi.id} onClick={() => navigate(`/detalhes/${pi.id}`)} style={{ cursor:'pointer' }}>
                        <td style={{ fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}>{formatTipo(pi.tipo)}</td>
                        <td style={{ maxWidth:360 }}><span title={pi.titulo} style={{ display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight:600, color:'var(--color-text)' }}>{pi.titulo || '-'}</span></td>
                        <td style={{ fontFamily:'var(--font-mono)', fontSize:12, whiteSpace:'nowrap' }}>{pi.protocolo || '-'}</td>
                        <td><span className={`badge ${pi.status?.replace(/\s+/g,'-')}`} style={{ fontSize:11 }}>{formatStatus(pi.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showUpdateModal && (
        <UpdateAuthorModal
          author={autor}
          onClose={() => setShowUpdateModal(false)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
