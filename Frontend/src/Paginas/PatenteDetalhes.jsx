import API_URL from '../config';
import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Pencil, Trash2, Edit2, FilePlus2, FilePen, Files, CircleDollarSign, FileText, Layers, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdicionarRPIModal from '../Components/AdicionarRPIModal';
import ViewPaymentModal from '../Components/ViewPaymentModal';
import Sidebar from '../Components/Sidebar';
import axios from 'axios';
import './Detalhe1.css';
import './Payments.css';
import { formatDate, formatStatus, formatTipo, formatStatusPagamento, daysUntil, formatCurrency } from '../utils/formatDate';
import Toast from '../Components/Toast';
import { invalidatePis } from '../services/piApi';

function normalizeStatus(status) {
  return status.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
}

const STATUS_PAGAMENTO_COLORS = {
  'aguardando prazo': { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  'em andamento': { bg: 'var(--color-primary-bg)', color: 'var(--color-primary)' },
  'pago': { bg: 'var(--color-success-bg)', color: 'var(--color-success)' }
};

const HISTORICO_ACOES = {
  'pi': {
    criacao: { titulo: 'PI cadastrada', icone: FilePlus2, cor: 'green' },
    atualizacao: { titulo: 'PI atualizada', icone: FilePen, cor: 'orange' }
  },
  'rpi': {
    criacao: { titulo: 'RPI registrada', icone: FilePlus2, cor: 'green' },
    atualizacao: { titulo: 'RPI atualizada', icone: FilePen, cor: 'orange' },
    exclusao: { titulo: 'RPI removida', icone: Files, cor: 'red' }
  },
  'pagamento': {
    criacao: { titulo: 'Pagamento registrado', icone: CircleDollarSign, cor: 'green' },
    atualizacao: { titulo: 'Pagamento atualizado', icone: FilePen, cor: 'orange' },
    exclusao: { titulo: 'Pagamento removido', icone: Files, cor: 'red' }
  }
};

const TABS = [
  { key: 'geral', label: 'Informações gerais' },
  { key: 'rpi', label: 'RPI' },
  { key: 'pagamentos', label: 'Pagamentos' },
  { key: 'historico', label: 'Histórico' }
];

export default function PatenteDetalhes() {
  document.title = 'GPI - Detalhes da PI';
  const navigate = useNavigate();
  const { id } = useParams();
  const [pi, setPi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('geral');
  const [rpiEvents, setRpiEvents] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [viewPayment, setViewPayment] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState(null);

  const loadHistorico = useCallback(() => {
    axios.get(`${API_URL}/api/pi/${id}/historico`)
      .then(res => setHistorico(res.data.data || []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/pi/${id}`),
      axios.get(`${API_URL}/api/pi/${id}/rpis`),
      axios.get(`${API_URL}/api/pi/${id}/pagamentos`),
      axios.get(`${API_URL}/api/pi/${id}/historico`)
    ])
      .then(([piRes, rpiRes, pagRes, histRes]) => {
        setPi(piRes.data.data);
        setRpiEvents(rpiRes.data.data || []);
        setPagamentos(pagRes.data.data || []);
        setHistorico(histRes.data.data || []);
      })
      .catch(err => {
        setLoadingError(err.response?.status === 404 ? 'PI não encontrada.' : 'Erro ao carregar PI.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/pi/${id}`);
      invalidatePis();
      setToast({ message: 'PI excluída com sucesso!', type: 'success' });
      setTimeout(() => navigate('/propriedade-intelectual'), 1200);
    } catch {
      setToast({ message: 'Erro ao excluir PI.', type: 'error' });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const openPaymentDetails = (p) => {
    setViewPayment({ ...p, pi: (pi.titulo || pi.protocolo || `PI ${pi.id}`) });
  };

  const handleAddRPI = async (newRPI) => {
    try {
      const res = await axios.post(`${API_URL}/api/rpi`, { ...newRPI, pi_id: Number(id) });
      setRpiEvents(prev => [...prev, res.data.data]);
      loadHistorico();
      setToast({ message: 'RPI adicionada com sucesso!', type: 'success' });
    } catch {
      setToast({ message: 'Erro ao adicionar RPI.', type: 'error' });
    }
  };

  const handleEditClick = (event, index) => {
    setEditingEvent(event);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleUpdateRPI = async (updatedEvent) => {
    try {
      const rpiId = rpiEvents[editingIndex].id;
      const res = await axios.put(`${API_URL}/api/rpi/${rpiId}`, updatedEvent);
      setRpiEvents(prev => prev.map((e, i) => i === editingIndex ? res.data.data : e));
      setEditingEvent(null);
      setEditingIndex(null);
      loadHistorico();
      setToast({ message: 'RPI atualizada com sucesso!', type: 'success' });
    } catch {
      setToast({ message: 'Erro ao atualizar RPI.', type: 'error' });
    }
  };

  const handleDeleteRPI = async () => {
    try {
      const rpiId = rpiEvents[editingIndex].id;
      await axios.delete(`${API_URL}/api/rpi/${rpiId}`);
      setRpiEvents(prev => prev.filter((_, i) => i !== editingIndex));
      setEditingEvent(null);
      setEditingIndex(null);
      loadHistorico();
      setToast({ message: 'RPI removida com sucesso!', type: 'success' });
    } catch {
      setToast({ message: 'Erro ao remover RPI.', type: 'error' });
    }
  };

  const openAddModal = () => { setEditingEvent(null); setEditingIndex(null); setIsModalOpen(true); };
  const closeModal = () => { setEditingEvent(null); setEditingIndex(null); setIsModalOpen(false); };

  if (loading) return (
    <div className="payments-page">
      <Sidebar />
      <div className="payments-content" style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-text-secondary)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:36, height:36, border:'3px solid var(--color-border)', borderTopColor:'var(--color-primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
          Carregando PI...
        </div>
      </div>
    </div>
  );

  if (loadingError) return (
    <div className="payments-page">
      <Sidebar />
      <div className="payments-content" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--color-text-secondary)', textAlign:'center', padding:40 }}>
        <p style={{ fontSize:18, fontWeight:700, marginBottom:12, color:'var(--color-text)' }}>{loadingError}</p>
        <button onClick={() => navigate('/propriedade-intelectual')} style={{
          background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '10px 24px',
          borderRadius: 10, fontSize: 13, fontWeight: 650, cursor: 'pointer', boxShadow:'0 4px 12px rgba(147,39,143,0.22)'
        }}>Voltar para lista</button>
      </div>
    </div>
  );

  if (!pi) return null;

  const autores = pi.autores || [];
  const parceiros = Array.isArray(pi.parceiro) ? pi.parceiro.filter(Boolean) : (pi.parceiro ? [pi.parceiro] : []);
  const titulares = Array.isArray(pi.titular) ? pi.titular.filter(Boolean) : (pi.titular ? [pi.titular] : []);

  return (
    <div className="payments-page">
      <Sidebar />
      <div className="payments-content anim-rise" style={{ padding:0, overflowY:'auto', background:'var(--color-bg)' }}>

        {/* Header amarelo — cor do dashboard */}
        <div style={{
          background: 'var(--header-pi-bg)',
          padding: '28px 32px 24px',
          color:'var(--header-pi-text)',
          position:'relative',
          overflow:'hidden'
        }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(600px 220px at 20% 0%, rgba(255,255,255,0.13), transparent 60%)', pointerEvents:'none' }} />

          {/* Top bar: Voltar + Editar/Excluir */}
          <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
            <button onClick={() => navigate(-1)} style={{
              background: 'var(--header-pi-badge-bg)', border:'1px solid var(--header-pi-border)', cursor:'pointer',
              padding:'8px 14px', borderRadius:10, display:'inline-flex', alignItems:'center', gap:6, color:'var(--header-pi-text)', fontSize:13, fontWeight:600,
              backdropFilter:'blur(6px)'
            }}>
              <ArrowLeft size={16} /> Voltar
            </button>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => navigate(`/editar-pi/${id}`)} style={{
                background:'var(--header-pi-badge-bg)', border:'1px solid var(--header-pi-border)', cursor:'pointer',
                padding:'8px 14px', borderRadius:10, display:'inline-flex', alignItems:'center', gap:6, color:'var(--header-pi-text)', fontSize:13, fontWeight:700,
                boxShadow:'0 4px 12px rgba(0,0,0,0.14)'
              }}>
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => setConfirmDelete(true)} style={{
                background:'var(--header-pi-danger)', border:'none', cursor:'pointer',
                padding:'8px 14px', borderRadius:10, display:'inline-flex', alignItems:'center', gap:6, color:'var(--header-pi-danger-text)', fontSize:13, fontWeight:600,
                boxShadow:'0 2px 8px rgba(220,38,38,0.3)'
              }}>
                <Trash2 size={14} /> Excluir
              </button>
            </div>
          </div>

          {/* Título + badges */}
          <div style={{ position:'relative', display:'flex', gap:18, alignItems:'center', marginBottom:20 }}>
            <div style={{
              width:64, height:64, borderRadius:14, background:'var(--header-pi-card)', color:'var(--header-pi-card-text)',
              display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:20,
              boxShadow:'0 8px 24px rgba(0,0,0,0.18)', border:'3px solid var(--header-pi-card)', flexShrink:0
            }}>
              <Layers size={28} />
            </div>
            <div style={{ minWidth:0, flex:1 }}>
              <h1 style={{ fontSize:26, fontWeight:800, color:'var(--header-pi-text)', margin:'0 0 4px', lineHeight:1.2, letterSpacing:'-0.02em' }}>
                {pi.titulo || "PI sem título"}
              </h1>
              <p style={{ margin:0, color:'var(--header-pi-text-secondary)', fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', background:'var(--header-pi-badge-bg)', borderRadius:999, fontSize:11, fontWeight:700 }}>{formatTipo(pi.tipo)}</span>
                <span className={`badge ${normalizeStatus(pi.status)}`} style={{ fontSize:11 }}>{formatStatus(pi.status)}</span>
                <span style={{ fontSize:12, opacity:0.8 }}>{pi.protocolo || '-'}</span>
                {autores.length > 0 && <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', background:'var(--header-pi-card)', borderRadius:999, fontSize:11, fontWeight:700, color:'var(--header-pi-card-text)' }}><Layers size={12} />{autores.length} Autor{autores.length!==1?'es':''}</span>}
              </p>
            </div>
          </div>

          {/* Info dentro do header — com separadores */}
          <div style={{ position:'relative', display:'flex', flexDirection:'column', gap:14 }}>

            {/* Identificação */}
            <div>
              <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--header-pi-text)', marginBottom:6 }}>Identificação</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:8, alignItems:'start' }}>
                <div>
                  <div style={{ fontSize:13, color:'var(--header-pi-text)', fontWeight:700, lineHeight:1.2 }}>Protocolo</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'var(--header-pi-text-secondary)', lineHeight:1.35 }}>{pi.protocolo || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize:13, color:'var(--header-pi-text)', fontWeight:700, lineHeight:1.2 }}>Depositante</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'var(--header-pi-text-secondary)', lineHeight:1.35 }}>{pi.depositante || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize:13, color:'var(--header-pi-text)', fontWeight:700, lineHeight:1.2 }}>Data de Entrada</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'var(--header-pi-text-secondary)', lineHeight:1.35 }}>{formatDate(pi.data_entrada) || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize:13, color:'var(--header-pi-text)', fontWeight:700, lineHeight:1.2 }}>Ano</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'var(--header-pi-text-secondary)', lineHeight:1.35 }}>{pi.ano || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize:13, color:'var(--header-pi-text)', fontWeight:700, lineHeight:1.2 }}>Termo de Cessão</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'var(--header-pi-text-secondary)', lineHeight:1.35 }}>{pi.termo_cessao ? 'Sim' : 'Não'}</div>
                </div>
              </div>
            </div>

            <div style={{ height:1, background:'var(--header-pi-border)', margin:'0' }} />

            {/* Titularidade */}
            <div>
              <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--header-pi-text)', marginBottom:6 }}>Titularidade</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:8, alignItems:'start' }}>
                <div>
                  <div style={{ fontSize:13, color:'var(--header-pi-text)', fontWeight:700, lineHeight:1.2 }}>Titulares</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'var(--header-pi-text-secondary)', lineHeight:1.35 }}>{titulares.length > 0 ? titulares.join(', ') : '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize:13, color:'var(--header-pi-text)', fontWeight:700, lineHeight:1.2 }}>Parceiros</div>
                  <div style={{ fontSize:11, fontWeight:500, color:'var(--header-pi-text-secondary)', lineHeight:1.35 }}>{parceiros.length > 0 ? parceiros.join(', ') : '—'}</div>
                </div>
              </div>
            </div>

            {autores.length > 0 && (
              <>
                <div style={{ height:1, background:'var(--header-pi-border)', margin:'0' }} />
                <div>
                  <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--header-pi-text)', marginBottom:6 }}>Autores vinculados</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {autores.map(a => (
                      <button key={a.id} onClick={() => navigate(`/autores/${a.id}`)} style={{
                        display:'inline-flex', alignItems:'center', gap:4,
                        background:'var(--header-pi-badge-bg)', color:'var(--header-pi-text)',
                        border:'none', borderRadius:999, padding:'4px 12px',
                        fontSize:11, fontWeight:600, cursor:'pointer',
                        backdropFilter:'blur(4px)', transition:'opacity 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity='0.8'}
                      onMouseLeave={e => e.currentTarget.style.opacity='1'}
                      >{a.name}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Conteúdo abaixo do header */}
        <div style={{ padding:'20px 32px 32px', maxWidth:1100, margin:'0 auto', width:'100%', boxSizing:'border-box' }}>

          {/* Tabs */}
          <div style={{ marginBottom:20, display:'flex', gap:8, flexWrap:'wrap' }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding:'8px 18px', borderRadius:8,
                backgroundColor: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
                color: activeTab === tab.key ? '#fff' : 'var(--color-text-secondary)',
                fontWeight:600, border: activeTab === tab.key ? 'none' : '1px solid var(--color-border)',
                cursor:'pointer', fontSize:13, transition:'all 0.15s'
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Tab: Geral */}
          {activeTab === 'geral' && (
            <div className="table-section">
              <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:32, height:32, borderRadius:8, background:'var(--color-primary-bg)', color:'var(--color-primary)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><FileText size={15} /></span>
                  <h3 style={{ margin:0, fontSize:13, fontWeight:700, color:'var(--color-text)' }}>Resumo</h3>
                </div>
              </div>
              <div style={{ padding:'16px 20px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px 24px', fontSize:13 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--color-text-secondary)', marginBottom:4 }}>Tipo</div>
                    <div style={{ fontWeight:600, color:'var(--color-text)' }}>{formatTipo(pi.tipo)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--color-text-secondary)', marginBottom:4 }}>Título</div>
                    <div style={{ fontWeight:600, color:'var(--color-text)' }}>{pi.titulo || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--color-text-secondary)', marginBottom:4 }}>Status</div>
                    <div><span className={`badge ${normalizeStatus(pi.status)}`} style={{ fontSize:11 }}>{formatStatus(pi.status)}</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--color-text-secondary)', marginBottom:4 }}>Protocolo</div>
                    <div style={{ fontWeight:600, color:'var(--color-text)', fontFamily:'var(--font-mono)' }}>{pi.protocolo || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--color-text-secondary)', marginBottom:4 }}>Depositante</div>
                    <div style={{ fontWeight:600, color:'var(--color-text)' }}>{pi.depositante || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--color-text-secondary)', marginBottom:4 }}>Data de Cadastro</div>
                    <div style={{ fontWeight:600, color:'var(--color-text)' }}>{pi.createdAt ? new Date(pi.createdAt).toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                  {pi.descricao && (
                    <div style={{ gridColumn:'1 / -1' }}>
                      <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--color-text-secondary)', marginBottom:4 }}>Descrição</div>
                      <div style={{ fontWeight:500, color:'var(--color-text)', lineHeight:1.6 }}>{pi.descricao}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: RPI */}
          {activeTab === 'rpi' && (
            <div className="table-section">
              <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:32, height:32, borderRadius:8, background:'var(--color-primary-bg)', color:'var(--color-primary)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><Clock size={15} /></span>
                  <h3 style={{ margin:0, fontSize:13, fontWeight:700, color:'var(--color-text)' }}>Eventos de RPI</h3>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ padding:'4px 10px', borderRadius:999, background:'var(--color-bg)', border:'1px solid var(--color-border)', fontSize:11, fontWeight:700, color:'var(--color-text-secondary)' }}>{rpiEvents.length}</span>
                  <button className="add-rpi-button" onClick={openAddModal} style={{ fontSize:12, padding:'6px 14px' }}>+ Adicionar</button>
                </div>
              </div>

              {rpiEvents.length === 0 ? (
                <div style={{ padding:'36px 20px', textAlign:'center' }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:'var(--color-bg)', border:'1px solid var(--color-border)', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:10, color:'var(--color-text-muted)' }}>
                    <Clock size={18} />
                  </div>
                  <p style={{ margin:'0 0 4px', fontWeight:650, color:'var(--color-text)', fontSize:13 }}>Nenhum evento RPI</p>
                  <p style={{ margin:0, fontSize:12, color:'var(--color-text-muted)' }}>Nenhum evento de Revista da Propriedade Industrial registrado para esta PI.</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th style={{ width:40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rpiEvents.map((event, index) => (
                        <tr key={event.id || index}>
                          <td style={{ fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}>{formatDate(event.data)}</td>
                          <td style={{ fontFamily:'var(--font-mono)', fontSize:12, whiteSpace:'nowrap' }}>{event.codigo_evento}</td>
                          <td style={{ fontSize:12, color:'var(--color-text-secondary)', maxWidth:0, width:'100%' }}>
                            <span style={{ display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={event.descricao_do_evento}>
                              {event.descricao_do_evento || '-'}
                            </span>
                          </td>
                          <td style={{ whiteSpace:'nowrap' }}>
                            <button onClick={() => handleEditClick(event, index)} title="Editar RPI" style={{
                              background:'none', border:'none', cursor:'pointer',
                              color:'var(--color-text-muted)', padding:4, borderRadius:4, display:'inline-flex',
                              alignItems:'center', justifyContent:'center',
                              transition:'color 0.15s, background 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-primary-bg)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'none'; }}
                            >
                              <Edit2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Pagamentos */}
          {activeTab === 'pagamentos' && (
            <div className="table-section">
              <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:32, height:32, borderRadius:8, background:'var(--color-primary-bg)', color:'var(--color-primary)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><CircleDollarSign size={15} /></span>
                  <h3 style={{ margin:0, fontSize:13, fontWeight:700, color:'var(--color-text)' }}>Pagamentos vinculados</h3>
                </div>
                <span style={{ padding:'4px 10px', borderRadius:999, background:'var(--color-bg)', border:'1px solid var(--color-border)', fontSize:11, fontWeight:700, color:'var(--color-text-secondary)' }}>{pagamentos.length}</span>
              </div>

              {pagamentos.length === 0 ? (
                <div style={{ padding:'36px 20px', textAlign:'center' }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:'var(--color-bg)', border:'1px solid var(--color-border)', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:10, color:'var(--color-text-muted)' }}>
                    <CircleDollarSign size={18} />
                  </div>
                  <p style={{ margin:'0 0 4px', fontWeight:650, color:'var(--color-text)', fontSize:13 }}>Nenhum pagamento</p>
                  <p style={{ margin:0, fontSize:12, color:'var(--color-text-muted)' }}>Nenhum pagamento registrado para esta PI.</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                        <th>Prazo</th>
                        <th>Processo SEI</th>
                        <th>Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagamentos.map(p => (
                        <tr key={p.id} onClick={() => openPaymentDetails(p)} style={{ cursor:'pointer' }}>
                          <td style={{ fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}>{p.tipo_de_pagamento || '-'}</td>
                          <td style={{ fontWeight:700, fontSize:12 }}>{formatCurrency(p.valor)}</td>
                          <td style={{ fontSize:12 }}>
                            {formatDate(p.data_de_vencimento)}
                            {p.data_informada && p.data_informada !== p.data_de_vencimento && (
                              <div style={{ fontSize:10, color:'var(--color-text-muted)', marginTop:2 }}>Inf: {formatDate(p.data_informada)}</div>
                            )}
                          </td>
                          <td>
                            <span style={{
                              display:'inline-block', padding:'3px 8px', borderRadius:999,
                              fontSize:11, fontWeight:600,
                              ...(STATUS_PAGAMENTO_COLORS[p.status] || { background:'var(--color-border)', color:'var(--color-text-secondary)' })
                            }}>{formatStatusPagamento(p.status)}</span>
                          </td>
                          <td style={{ fontSize:12 }}>
                            {p.prazo_dias ? `${p.prazo_dias}d` : '-'}
                            {p.data_de_vencimento && (p.status || 'aguardando prazo') !== 'pago' && (p.status || 'aguardando prazo') !== 'aguardando prazo' && (() => {
                              const diff = daysUntil(p.data_de_vencimento);
                              if (diff === null) return null;
                              const text = diff > 0 ? `${diff}d` : diff === 0 ? 'hoje' : `${Math.abs(diff)}d`;
                              const color = diff > 0 ? 'var(--color-success)' : diff === 0 ? 'var(--color-warning)' : 'var(--color-error)';
                              return <div style={{ fontSize:10, fontWeight:600, color, marginTop:2 }}>{text}</div>;
                            })()}
                          </td>
                          <td style={{ fontSize:12, fontFamily:'var(--font-mono)' }}>{p.processo_sei || '-'}</td>
                          <td style={{ fontSize:12, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.observacao || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Histórico */}
          {activeTab === 'historico' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:32, height:32, borderRadius:8, background:'var(--color-primary-bg)', color:'var(--color-primary)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><FilePen size={15} /></span>
                  <h3 style={{ margin:0, fontSize:13, fontWeight:700, color:'var(--color-text)' }}>Histórico de Eventos</h3>
                </div>
                <span style={{ padding:'4px 10px', borderRadius:999, background:'var(--color-bg)', border:'1px solid var(--color-border)', fontSize:11, fontWeight:700, color:'var(--color-text-secondary)' }}>{historico.length}</span>
              </div>

              {historico.length === 0 ? (
                <div style={{ padding:'36px 20px', textAlign:'center' }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:'var(--color-bg)', border:'1px solid var(--color-border)', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:10, color:'var(--color-text-muted)' }}>
                    <FilePen size={18} />
                  </div>
                  <p style={{ margin:'0 0 4px', fontWeight:650, color:'var(--color-text)', fontSize:13 }}>Nenhum evento</p>
                  <p style={{ margin:0, fontSize:12, color:'var(--color-text-muted)' }}>Nenhum evento registrado no histórico desta PI.</p>
                </div>
              ) : (
                <div className="timeline" style={{ padding:'16px 20px' }}>
                  {historico.map((h, index) => {
                    const meta = HISTORICO_ACOES[h.tipo]?.[h.acao] || {
                      titulo: `${h.tipo} — ${h.acao}`,
                      icone: FilePlus2,
                      cor: 'orange'
                    };
                    const Icone = meta.icone;
                    return (
                      <div key={h.id || index} className="timeline-item">
                        <span className={`timeline-icon ${meta.cor}`} style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Icone size={16} color="#fff" />
                        </span>
                        <div className="timeline-content">
                          <span className="timeline-date">
                            {h.createdAt ? new Date(h.createdAt).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}
                            {h.usuario_nome && <span className="timeline-user"> por {h.usuario_nome}</span>}
                          </span>
                          <h4 className="timeline-title">{meta.titulo}</h4>
                          <p className="timeline-description">{h.descricao}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AdicionarRPIModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onAddRPI={handleAddRPI}
        onUpdateRPI={handleUpdateRPI}
        onDeleteRPI={handleDeleteRPI}
        event={editingEvent}
      />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {viewPayment && <ViewPaymentModal payment={viewPayment} onClose={() => setViewPayment(null)} />}

      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
          onClick={() => !deleting && setConfirmDelete(false)}>
          <div style={{ background:'var(--color-surface)', borderRadius:12, padding:32, maxWidth:420, width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin:'0 0 8px', color:'var(--color-text)', fontSize:18 }}>Confirmar exclusão</h3>
            <p style={{ color:'var(--color-text-secondary)', fontSize:14, lineHeight:1.5 }}>
              Tem certeza que deseja excluir a PI <strong>{pi.protocolo}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 }}>
              <button onClick={() => setConfirmDelete(false)} disabled={deleting}
                style={{ padding:'10px 20px', borderRadius:8, border:'1px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text-secondary)', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding:'10px 20px', borderRadius:8, border:'none', background:'var(--color-error)', color:'#fff', fontSize:14, fontWeight:600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
