import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Plus, Search, BarChart3, TrendingUp, Clock, CheckCircle2, Eye, Pencil } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Calendar from '../Components/Calendar';
import RegisterPaymentModal from '../Components/RegisterPaymentModal';
import UpdatePaymentModal from '../Components/UpdatePaymentModal';
import ViewPaymentModal from '../Components/ViewPaymentModal';
import Toast from '../Components/Toast';
import { formatStatusPagamento, daysUntil } from '../utils/formatDate';
import { getPis } from '../services/piApi';
import './Payments.css';

const API = process.env.REACT_APP_API_URL;
const PAGE_SIZE = 10;

const toLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = String(str).slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

function getPageWindow(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: 5 }, (_, i) => start + i);
}

export default function Payments() {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [allPayments, setAllPayments] = useState([]);
  const [tablePayments, setTablePayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);
  const [pis, setPis] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const openedFromParam = useRef(false);

  const loadAllPayments = useCallback(async () => {
    const res = await axios.get(`${API}/api/pagamentos`);
    setAllPayments(res.data.data || []);
  }, []);

  const loadTable = useCallback(async (page, term) => {
    setTableLoading(true);
    try {
      const res = await axios.get(`${API}/api/pagamentos`, {
        params: { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, q: term || undefined }
      });
      setTablePayments(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Erro ao buscar pagamentos:", err);
      setTablePayments([]);
      setTotal(0);
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllPayments().catch(err => console.error("Erro ao buscar pagamentos:", err));
    getPis()
      .then(list => setPis(list))
      .catch(err => console.error("Erro ao buscar PIs:", err));
  }, [loadAllPayments]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTable(currentPage, searchTerm);
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, loadTable]);

  const piMap = {};
  pis.forEach(pi => { piMap[pi.id] = pi; });

  const enrich = (list) => list.map(p => {
    const pi = piMap[p.pi_id];
    return {
      ...p,
      pi: pi ? (pi.titulo || pi.protocolo || `PI ${p.pi_id}`) : `PI ${p.pi_id}`,
      dueDate: toLocalDate(p.data_de_vencimento)
    };
  });

  const enrichedPayments = enrich(allPayments);
  const enrichedTablePayments = enrich(tablePayments);

  useEffect(() => {
    const pagamentoId = searchParams.get('pagamento');
    if (!pagamentoId || openedFromParam.current) return;
    const payment = enrichedPayments.find(p => String(p.id) === String(pagamentoId));
    if (!payment) return;
    openedFromParam.current = true;
    setSelectedPayment(payment);
    setShowViewModal(true);
    setSearchParams({}, { replace: true });
  }, [searchParams, enrichedPayments, setSearchParams]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalValue = enrichedPayments.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
  const statusCount = (status) =>
    enrichedPayments.filter(p => (p.status || 'aguardando prazo') === status).length;

  const stats = {
    total: enrichedPayments.length,
    valorTotal: totalValue,
    aguardandoPrazo: statusCount('aguardando prazo'),
    emAndamento: statusCount('em andamento'),
    pago: statusCount('pago')
  };

  const formatCurrency = (val) =>
    `R$ ${Number(val || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

  const renderDaysLeft = (p) => {
    if (!p.data_de_vencimento) return null;
    const status = p.status || 'aguardando prazo';
    if (status === 'pago' || status === 'aguardando prazo') return null;
    const diff = daysUntil(p.data_de_vencimento);
    if (diff === null) return null;
    let text;
    let color;
    if (diff > 0) {
      text = `Vence em ${diff} dia${diff !== 1 ? 's' : ''}`;
      color = 'var(--color-success)';
    } else if (diff === 0) {
      text = 'Vence hoje';
      color = 'var(--color-warning)';
    } else {
      const abs = Math.abs(diff);
      text = `Venceu há ${abs} dia${abs !== 1 ? 's' : ''}`;
      color = 'var(--color-error)';
    }
    return <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 2 }}>{text}</div>;
  };

  const upcomingPayments = [...enrichedPayments]
    .filter(p => {
      if (!p.dueDate || p.dueDate < today) return false;
      if (!p.prazo_dias) return false;
      const diff = daysUntil(p.data_de_vencimento);
      if (diff === null) return false;
      return diff < Number(p.prazo_dias);
    })
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 5);

  const handleOpenUpdateModal = (payment) => {
    setSelectedPayment(payment);
    setShowUpdateModal(true);
  };

  const handleOpenViewModal = (payment) => {
    setSelectedPayment(payment);
    setShowViewModal(true);
  };

  const handleRegister = async (payload) => {
    await axios.post(`${API}/api/pagamentos`, payload);
    await Promise.all([loadAllPayments(), loadTable(currentPage, searchTerm)]);
    setToast({ message: 'Pagamento registrado com sucesso!', type: 'success' });
  };

  const handleUpdate = async (payload) => {
    await axios.put(`${API}/api/pagamentos/${selectedPayment.id}`, payload);
    await Promise.all([loadAllPayments(), loadTable(currentPage, searchTerm)]);
    setToast({ message: 'Pagamento atualizado com sucesso!', type: 'success' });
  };

  const handleDelete = async () => {
    await axios.delete(`${API}/api/pagamentos/${selectedPayment.id}`);
    await loadAllPayments();
    if (tablePayments.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else {
      await loadTable(currentPage, searchTerm);
    }
    setToast({ message: 'Pagamento removido com sucesso!', type: 'success' });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const indexOfFirst = (currentPage - 1) * PAGE_SIZE + 1;
  const indexOfLast = Math.min(currentPage * PAGE_SIZE, total);
  const pageNumbers = getPageWindow(currentPage, totalPages);

  return (
    <div className="payments-page">
      <Sidebar />
      <div className="payments-content">
        <div className="payments-header">
          <div>
            <h1 className="payments-title">Gestão de Pagamentos</h1>
            <p className="payments-subtitle">
              {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="payments-btn-primary" onClick={() => setShowRegisterModal(true)}>
            <Plus size={18} /> Novo Pagamento
          </button>
        </div>

        <div className="payments-stats">
          <div className="stat-card stat-card--total">
            <div className="stat-icon" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}>
              <BarChart3 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total</span>
              <span className="stat-amount">{formatCurrency(stats.valorTotal)}</span>
            </div>
          </div>
          <div className="stat-card stat-card--pending">
            <div className="stat-icon" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.aguardandoPrazo}</span>
              <span className="stat-label">Aguardando prazo</span>
            </div>
          </div>
          <div className="stat-card stat-card--andamento">
            <div className="stat-icon" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}>
              <TrendingUp size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.emAndamento}</span>
              <span className="stat-label">Em andamento</span>
            </div>
          </div>
          <div className="stat-card stat-card--paid">
            <div className="stat-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <CheckCircle2 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.pago}</span>
              <span className="stat-label">Pago</span>
            </div>
          </div>
        </div>

        <div className="payments-layout">
          <div className="payments-main">
            <div className="table-section">
              <div className="table-toolbar">
                <div className="search-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar pagamentos..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="search-input"
                  />
                </div>
              </div>
              <div className="table-scroll">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>PI</th>
                      <th>Valor</th>
                      <th>Data Informada</th>
                      <th>Data Final</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedTablePayments.map((p, i) => (
                      <tr key={i}>
                        <td className="td-desc">{p.tipo_de_pagamento || `Pagamento #${p.id}`}</td>
                        <td className="td-pi">{p.pi}</td>
                        <td className="td-value">{formatCurrency(parseFloat(p.valor) || 0)}</td>
                        <td>
                          <div>{p.data_informada ? toLocalDate(p.data_informada)?.toLocaleDateString('pt-BR') : '-'}</div>
                        </td>
                        <td>
                          <div>{p.dueDate ? p.dueDate.toLocaleDateString('pt-BR') : '-'}</div>
                          {renderDaysLeft(p)}
                        </td>
                        <td>
                          <span className={`status-badge status-badge--${(p.status || 'aguardando prazo').toLowerCase().replace(/\s+/g, '')}`}>
                            {formatStatusPagamento(p.status)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-acao" title="Visualizar" onClick={() => handleOpenViewModal(p)}>
                              <Eye size={18} />
                            </button>
                            <button className="btn-acao" title="Editar" onClick={() => handleOpenUpdateModal(p)}>
                              <Pencil size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tableLoading && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>
                          Carregando pagamentos...
                        </td>
                      </tr>
                    )}
                    {!tableLoading && enrichedTablePayments.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>
                          Nenhum pagamento encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {total > PAGE_SIZE && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 20, fontSize: 14
              }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Exibindo {indexOfFirst}–{indexOfLast} de {total} pagamentos
                </span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                      background: currentPage === 1 ? 'var(--color-border-light)' : 'var(--color-surface)',
                      color: currentPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                      fontWeight: 600, fontSize: 13, cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >Anterior</button>
                  {pageNumbers.map(number => (
                    <button
                      key={number}
                      onClick={() => setCurrentPage(number)}
                      style={{
                        padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                        background: currentPage === number ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: currentPage === number ? '#fff' : 'var(--color-text-secondary)',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer', minWidth: 36
                      }}
                    >{number}</button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                      background: currentPage === totalPages ? 'var(--color-border-light)' : 'var(--color-surface)',
                      color: currentPage === totalPages ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                      fontWeight: 600, fontSize: 13, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >Próxima</button>
                </div>
              </div>
            )}
          </div>

          <aside className="payments-side">
            <Calendar
              selectedDate={calendarSelectedDate}
              setSelectedDate={setCalendarSelectedDate}
              payments={enrichedPayments}
            />

            {upcomingPayments.length > 0 && (
              <div className="upcoming-section">
                <h2 className="section-title">Próximos Vencimentos</h2>
                <div className="upcoming-grid">
                  {upcomingPayments.map((p, i) => (
                    <div key={i} className="upcoming-item">
                      <div className="upcoming-left">
                        <p className="upcoming-title">{p.tipo_de_pagamento || `Pagamento #${p.id}`}</p>
                        <span className="upcoming-date">
                          <CalendarIcon size={12} />
                          {p.dueDate ? p.dueDate.toLocaleDateString('pt-BR') : '-'}
                        </span>
                        {renderDaysLeft(p)}
                        {p.data_informada && p.data_informada !== p.data_de_vencimento && (() => {
                          const info = toLocalDate(p.data_informada);
                          return info ? (
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              Informada: {info.toLocaleDateString('pt-BR')}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <div className="upcoming-right">
                        <span className={`upcoming-status status-badge--${(p.status || 'aguardando prazo').toLowerCase().replace(/\s+/g, '')}`}>
                          {formatStatusPagamento(p.status)}
                        </span>
                        <span className="upcoming-value">
                          {formatCurrency(parseFloat(p.valor) || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {showRegisterModal && (
          <RegisterPaymentModal
            onClose={() => setShowRegisterModal(false)}
            onRegister={handleRegister}
          />
        )}
        {showUpdateModal && (
          <UpdatePaymentModal
            payment={selectedPayment}
            onClose={() => setShowUpdateModal(false)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
        {showViewModal && (
          <ViewPaymentModal
            payment={selectedPayment}
            onClose={() => setShowViewModal(false)}
          />
        )}
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
