import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Pencil, Trash2, Edit2, FilePlus2, FilePen, Files, CircleDollarSign } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdicionarRPIModal from '../Components/AdicionarRPIModal';
import ViewPaymentModal from '../Components/ViewPaymentModal';
import Sidebar from '../Components/Sidebar';
import axios from 'axios';
import './Detalhe1.css';
import { formatDate, formatStatus, formatTipo, formatStatusPagamento, daysUntil } from '../utils/formatDate';
import Toast from '../Components/Toast';
import { invalidatePis } from '../services/piApi';

function normalizeStatus(status) {
  return status.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
}

function formatCurrency(val) {
  return `R$ ${Number(val || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
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

export default function PatenteDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [pi, setPi] = useState(null);
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
    const api = process.env.REACT_APP_API_URL;
    axios.get(`${api}/api/pi/${id}/historico`)
      .then(res => setHistorico(res.data.data || []))
      .catch(err => console.error("Erro ao buscar histórico:", err));
  }, [id]);

  useEffect(() => {
    const api = process.env.REACT_APP_API_URL;
    axios.get(`${api}/api/pi/${id}`)
      .then(res => {
        setPi(res.data.data);
        setLoadingError(null);
      })
      .catch(err => {
        console.error("Erro ao buscar PI:", err);
        setLoadingError(err.response?.status === 404 ? 'PI não encontrada.' : 'Erro ao carregar PI.');
      });

    axios.get(`${api}/api/pi/${id}/rpis`)
      .then(res => setRpiEvents(res.data.data || []))
      .catch(err => console.error("Erro ao buscar RPIs:", err));

    axios.get(`${api}/api/pi/${id}/pagamentos`)
      .then(res => setPagamentos(res.data.data || []))
      .catch(err => console.error("Erro ao buscar pagamentos:", err));

    loadHistorico();
  }, [id, loadHistorico]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/pi/${id}`);
      invalidatePis();
      setToast({ message: 'PI excluída com sucesso!', type: 'success' });
      setTimeout(() => navigate('/propriedade-intelectual'), 1200);
    } catch (err) {
      console.error("Erro ao deletar PI:", err);
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
      const api = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${api}/api/rpi`, { ...newRPI, pi_id: Number(id) });
      setRpiEvents(prev => [...prev, res.data.data]);
      loadHistorico();
      setToast({ message: 'RPI adicionada com sucesso!', type: 'success' });
    } catch (err) {
      console.error("Erro ao adicionar RPI:", err);
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
      const api = process.env.REACT_APP_API_URL;
      const res = await axios.put(`${api}/api/rpi/${rpiId}`, updatedEvent);
      setRpiEvents(prev => prev.map((e, i) => i === editingIndex ? res.data.data : e));
      setEditingEvent(null);
      setEditingIndex(null);
      loadHistorico();
      setToast({ message: 'RPI atualizada com sucesso!', type: 'success' });
    } catch (err) {
      console.error("Erro ao atualizar RPI:", err);
      setToast({ message: 'Erro ao atualizar RPI.', type: 'error' });
    }
  };

  const handleDeleteRPI = async () => {
    try {
      const rpiId = rpiEvents[editingIndex].id;
      const api = process.env.REACT_APP_API_URL;
      await axios.delete(`${api}/api/rpi/${rpiId}`);
      setRpiEvents(prev => prev.filter((_, i) => i !== editingIndex));
      setEditingEvent(null);
      setEditingIndex(null);
      loadHistorico();
      setToast({ message: 'RPI removida com sucesso!', type: 'success' });
    } catch (err) {
      console.error("Erro ao remover RPI:", err);
      setToast({ message: 'Erro ao remover RPI.', type: 'error' });
    }
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingEvent(null);
    setEditingIndex(null);
    setIsModalOpen(false);
  };

  if (loadingError) return (
    <div className="container">
      <Sidebar />
      <main style={{ flex: 1, padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{loadingError}</p>
        <button onClick={() => navigate('/propriedade-intelectual')} style={{
          background: '#93278F', color: '#fff', border: 'none', padding: '10px 24px',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
        }}>Voltar para lista</button>
      </main>
    </div>
  );

  if (!pi) return <div className="container"><Sidebar /><main style={{ flex: 1, padding: 30 }}>Carregando...</main></div>;

  return (
    <div className="container">
      <Sidebar />

      <main style={{ flex: 1, backgroundColor: "var(--color-bg)", overflowY: 'auto' }}>
        <div className="detalhes-header" style={{
          padding: '40px 40px 32px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <button onClick={() => navigate(-1)} style={{
              background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
              padding: '8px 12px', borderRadius: 8, display: 'inline-flex',
              alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 500,
            }}>
              <ArrowLeft size={16} /> Voltar
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate(`/editar-pi/${id}`)} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
                padding: '8px 14px', borderRadius: 8, display: 'inline-flex',
                alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 500,
              }}>
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => setConfirmDelete(true)} style={{
                background: 'rgba(239,68,68,0.2)', border: 'none', cursor: 'pointer',
                padding: '8px 14px', borderRadius: 8, display: 'inline-flex',
                alignItems: 'center', gap: 6, color: '#FCA5A5', fontSize: 13, fontWeight: 500,
              }}>
                <Trash2 size={14} /> Excluir
              </button>
            </div>
          </div>

          <h1 style={{
            fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 0 6px',
            letterSpacing: '-0.5px', lineHeight: 1.2
          }}>
            {pi.titulo || "PI sem título"}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '4px 14px',
              borderRadius: 20, fontSize: 13, fontWeight: 600, textTransform: 'capitalize'
            }}>
              {formatTipo(pi.tipo)}
            </span>
            <span className={`badge ${normalizeStatus(pi.status)}`} style={{ fontSize: 13 }}>
              {formatStatus(pi.status)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              Protocolo: {pi.protocolo || "-"}
            </span>
          </div>
        </div>

        <div style={{ padding: '24px 40px' }}>
          <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
            <button onClick={() => setActiveTab('geral')} style={{
              padding: '10px 20px', borderRadius: 8,
              backgroundColor: activeTab === 'geral' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'geral' ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: 600, border: activeTab === 'geral' ? 'none' : '1px solid #E2E8F0',
              cursor: "pointer", fontSize: 14
            }}>Informações gerais</button>
            <button onClick={() => setActiveTab('historico')} style={{
              padding: '10px 20px', borderRadius: 8,
              backgroundColor: activeTab === 'historico' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'historico' ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: 600, border: activeTab === 'historico' ? 'none' : '1px solid #E2E8F0',
              cursor: "pointer", fontSize: 14
            }}>Histórico</button>
            <button onClick={() => setActiveTab('pagamentos')} style={{
              padding: '10px 20px', borderRadius: 8,
              backgroundColor: activeTab === 'pagamentos' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'pagamentos' ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: 600, border: activeTab === 'pagamentos' ? 'none' : '1px solid #E2E8F0',
              cursor: "pointer", fontSize: 14
            }}>Pagamentos</button>
          </div>

          {activeTab === 'geral' && (
            <>
              <div style={{
                background: 'var(--color-surface)', padding: '28px 32px', borderRadius: 12,
                border: '1px solid var(--color-border)', marginBottom: 28
              }}>
                <h3 style={{ color: 'var(--color-primary)', margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>
                  Informações principais
                </h3>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '20px 32px', fontSize: 14
                }}>
                  <div><strong style={{ color: 'var(--color-text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</strong><br /><span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{formatTipo(pi.tipo)}</span></div>
                  <div><strong style={{ color: 'var(--color-text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Título</strong><br /><span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{pi.titulo || "-"}</span></div>
                  <div><strong style={{ color: 'var(--color-text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</strong><br /><span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{formatStatus(pi.status)}</span></div>
                  <div><strong style={{ color: 'var(--color-text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Protocolo</strong><br /><span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{pi.protocolo || "-"}</span></div>
                  <div><strong style={{ color: 'var(--color-text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Depositante</strong><br /><span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{pi.depositante || "-"}</span></div>
                  <div><strong style={{ color: 'var(--color-text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Parceiro</strong><br /><span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{pi.parceiro || "-"}</span></div>
                  <div><strong style={{ color: 'var(--color-text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Titulares</strong><br /><span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{Array.isArray(pi.titular) ? pi.titular.filter(Boolean).join(', ') : (pi.titular || "-")}</span></div>
                  <div><strong style={{ color: 'var(--color-text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data de Entrada</strong><br /><span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{formatDate(pi.data_entrada)}</span></div>
                  <div><strong style={{ color: 'var(--color-text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ano</strong><br /><span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{pi.ano || "-"}</span></div>
                  <div><strong style={{ color: 'var(--color-text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Termo de Cessão</strong><br /><span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{pi.termo_cessao ? "Sim" : "Não"}</span></div>
                  <div><strong style={{ color: 'var(--color-text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data de Cadastro</strong><br /><span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{pi.createdAt ? new Date(pi.createdAt).toLocaleDateString("pt-BR") : "-"}</span></div>
                </div>
              </div>

              <div className="patente-detalhes-container">
                <div className="header">
                  <div className="title-section">
                    <h1>Informações de RPI</h1>
                  </div>
                  <button className="add-rpi-button" onClick={openAddModal}>+ Adicionar RPI</button>
                </div>

                {rpiEvents.length === 0 ? (
                  <p style={{ padding: 16, color: '#888' }}>Nenhum evento RPI registrado</p>
                ) : (
                  <div className="rpi-events-grid">
                    {rpiEvents.map((event, index) => (
                      <div key={index} className="rpi-card">
                        <div className="rpi-card-body">
                          <p className="rpi-date">{formatDate(event.data)}</p>
                          <span className="rpi-code">Código: {event.codigo_evento}</span>
                          <p className="rpi-description">{event.descricao_do_evento}</p>
                        </div>
                        <button className="rpi-edit-btn" onClick={() => handleEditClick(event, index)} title="Editar RPI">
                          <Edit2 size={16} />
                        </button>
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

              {historico.length === 0 ? (
                <p style={{ padding: 16, color: '#888' }}>Nenhum evento registrado</p>
              ) : (
                <div className="timeline">
                  {historico.map((h, index) => {
                    const meta = HISTORICO_ACOES[h.tipo]?.[h.acao] || {
                      titulo: `${h.tipo} — ${h.acao}`,
                      icone: FilePlus2,
                      cor: 'orange'
                    };
                    const Icone = meta.icone;
                    return (
                      <div key={h.id || index} className="timeline-item">
                        <span className={`timeline-icon ${meta.cor}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icone size={10} color="#fff" />
                        </span>
                        <div className="timeline-content">
                          <span className="timeline-date">
                            {h.createdAt ? new Date(h.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
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

          {activeTab === 'pagamentos' && (
            <div style={{
              background: 'var(--color-surface)', padding: '28px 32px', borderRadius: 12,
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ color: 'var(--color-primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
                  Pagamentos vinculados
                </h3>
              </div>

              {pagamentos.length === 0 ? (
                <p style={{ padding: 16, color: '#888' }}>Nenhum pagamento registrado para esta PI</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr>
                        {['Tipo', 'Valor', 'Data Calculada', 'Status', 'Prazo', 'Processo SEI', 'Observações'].map(h => (
                          <th key={h} style={{
                            textAlign: 'left', padding: '10px 12px', fontSize: 12,
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            color: 'var(--color-text-secondary)', borderBottom: '2px solid var(--color-border)'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagamentos.map(p => (
                        <tr
                          key={p.id}
                          onClick={() => openPaymentDetails(p)}
                          title="Clique para ver detalhes"
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-hover)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', fontWeight: 600, color: 'var(--color-text)' }}>
                            {p.tipo_de_pagamento || '-'}
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', fontWeight: 700, color: 'var(--color-text)' }}>
                            {formatCurrency(p.valor)}
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', color: 'var(--color-text)' }}>
                            {formatDate(p.data_de_vencimento)}
                            {p.data_informada && p.data_informada !== p.data_de_vencimento && (
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                Informada: {formatDate(p.data_informada)}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)' }}>
                            <span style={{
                              display: 'inline-block', padding: '4px 10px', borderRadius: 20,
                              fontSize: 12, fontWeight: 600,
                              ...(STATUS_PAGAMENTO_COLORS[p.status] || { background: 'var(--color-border)', color: 'var(--color-text-secondary)' })
                            }}>
                              {formatStatusPagamento(p.status)}
                            </span>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', color: 'var(--color-text)' }}>
                            {p.prazo_dias ? `${p.prazo_dias} dia${p.prazo_dias !== 1 ? 's' : ''}` : '-'}
                            {p.data_de_vencimento && (p.status || 'aguardando prazo') !== 'pago' && (p.status || 'aguardando prazo') !== 'aguardando prazo' && (() => {
                              const diff = daysUntil(p.data_de_vencimento);
                              if (diff === null) return null;
                              const text = diff > 0 ? `${diff}d` : diff === 0 ? 'hoje' : `${Math.abs(diff)}d atrasado`;
                              const color = diff > 0 ? 'var(--color-success)' : diff === 0 ? 'var(--color-warning)' : 'var(--color-error)';
                              return <div style={{ fontSize: 12, fontWeight: 600, color, marginTop: 2 }}>{text}</div>;
                            })()}
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', color: 'var(--color-text)' }}>
                            {p.processo_sei || '-'}
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', color: 'var(--color-text)' }}>
                            {p.observacao || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <AdicionarRPIModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onAddRPI={handleAddRPI}
        onUpdateRPI={handleUpdateRPI}
        onDeleteRPI={handleDeleteRPI}
        event={editingEvent}
      />

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {viewPayment && (
        <ViewPaymentModal payment={viewPayment} onClose={() => setViewPayment(null)} />
      )}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => !deleting && setConfirmDelete(false)}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 12, padding: 32, maxWidth: 420,
            width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--color-text)', fontSize: 18 }}>Confirmar exclusão</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
              Tem certeza que deseja excluir a PI <strong>{pi.protocolo}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)', color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer'
                }}
              >Cancelar</button>
              <button
                onClick={handleDelete}
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
