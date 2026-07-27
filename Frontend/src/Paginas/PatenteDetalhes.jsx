import React, { useState, useEffect } from "react";
import { ArrowLeft, Pencil, Trash2, Edit2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdicionarRPIModal from '../Components/AdicionarRPIModal';
import Sidebar from '../Components/Sidebar';
import axios from 'axios';
import './Detalhe1.css';
import { formatDate, formatStatus } from '../utils/formatDate';
import Toast from '../Components/Toast';

function normalizeStatus(status) {
  return status.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
}

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
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState(null);

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
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/pi/${id}`);
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

  const handleAddRPI = async (newRPI) => {
    try {
      const api = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${api}/api/rpi`, { ...newRPI, pi_id: Number(id) });
      setRpiEvents(prev => [...prev, res.data.data]);
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
      <main style={{ flex: 1, padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{loadingError}</p>
        <button onClick={() => navigate('/propriedade-intelectual')} style={{
          background: '#7C3AED', color: '#fff', border: 'none', padding: '10px 24px',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
        }}>Voltar para lista</button>
      </main>
    </div>
  );

  if (!pi) return <div className="container"><Sidebar /><main style={{ flex: 1, padding: 30 }}>Carregando...</main></div>;

  return (
    <div className="container">
      <Sidebar />

      <main style={{ flex: 1, backgroundColor: "#f3f4f6", overflowY: 'auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #6B21A8 0%, #3B0764 100%)',
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
              {pi.tipo}
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
          <div style={{ marginBottom: 20 }}>
            <button onClick={() => setActiveTab('geral')} style={{
              padding: '10px 20px', borderRadius: 8,
              backgroundColor: activeTab === 'geral' ? '#6B21A8' : 'transparent',
              color: activeTab === 'geral' ? '#fff' : '#64748B',
              fontWeight: 600, border: activeTab === 'geral' ? 'none' : '1px solid #E2E8F0',
              cursor: "pointer", marginRight: 10, fontSize: 14
            }}>Informações gerais</button>
            <button onClick={() => setActiveTab('historico')} style={{
              padding: '10px 20px', borderRadius: 8,
              backgroundColor: activeTab === 'historico' ? '#6B21A8' : 'transparent',
              color: activeTab === 'historico' ? '#fff' : '#64748B',
              fontWeight: 600, border: activeTab === 'historico' ? 'none' : '1px solid #E2E8F0',
              cursor: "pointer", fontSize: 14
            }}>Histórico</button>
          </div>

          {activeTab === 'geral' && (
            <>
              <div style={{
                background: '#fff', padding: '28px 32px', borderRadius: 12,
                border: '1px solid #E2E8F0', marginBottom: 28
              }}>
                <h3 style={{ color: '#6B21A8', margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>
                  Informações principais
                </h3>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '20px 32px', fontSize: 14
                }}>
                  <div><strong style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</strong><br /><span style={{ color: '#1E293B', fontWeight: 600, textTransform: 'capitalize' }}>{pi.tipo}</span></div>
                  <div><strong style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Título</strong><br /><span style={{ color: '#1E293B', fontWeight: 600 }}>{pi.titulo || "-"}</span></div>
                  <div><strong style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</strong><br /><span style={{ color: '#1E293B', fontWeight: 600 }}>{formatStatus(pi.status)}</span></div>
                  <div><strong style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Protocolo</strong><br /><span style={{ color: '#1E293B', fontWeight: 600 }}>{pi.protocolo || "-"}</span></div>
                  <div><strong style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Depositante</strong><br /><span style={{ color: '#1E293B', fontWeight: 600 }}>{pi.depositante || "-"}</span></div>
                  <div><strong style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Parceiro</strong><br /><span style={{ color: '#1E293B', fontWeight: 600 }}>{pi.parceiro || "-"}</span></div>
                  <div><strong style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Titulares</strong><br /><span style={{ color: '#1E293B', fontWeight: 600 }}>{Array.isArray(pi.titular) ? pi.titular.filter(Boolean).join(', ') : (pi.titular || "-")}</span></div>
                  <div><strong style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data de Entrada</strong><br /><span style={{ color: '#1E293B', fontWeight: 600 }}>{formatDate(pi.data_entrada)}</span></div>
                  <div><strong style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ano</strong><br /><span style={{ color: '#1E293B', fontWeight: 600 }}>{pi.ano || "-"}</span></div>
                  <div><strong style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Termo de Cessão</strong><br /><span style={{ color: '#1E293B', fontWeight: 600 }}>{pi.termo_cessao ? "Sim" : "Não"}</span></div>
                  <div><strong style={{ color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data de Cadastro</strong><br /><span style={{ color: '#1E293B', fontWeight: 600 }}>{pi.createdAt ? new Date(pi.createdAt).toLocaleDateString("pt-BR") : "-"}</span></div>
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
              <p style={{ padding: 16, color: '#888' }}>Nenhum evento registrado</p>
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
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => !deleting && setConfirmDelete(false)}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 32, maxWidth: 420,
            width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', color: '#1E293B', fontSize: 18 }}>Confirmar exclusão</h3>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.5 }}>
              Tem certeza que deseja excluir a PI <strong>{pi.protocolo}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid #E2E8F0',
                  background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600,
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
