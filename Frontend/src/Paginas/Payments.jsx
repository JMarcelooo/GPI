import API_URL from '../config';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Plus, Search, BarChart3, TrendingUp, Clock, CheckCircle2, Eye, Pencil, Info, X } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Calendar from '../Components/Calendar';
import RegisterPaymentModal from '../Components/RegisterPaymentModal';
import UpdatePaymentModal from '../Components/UpdatePaymentModal';
import ViewPaymentModal from '../Components/ViewPaymentModal';
import Toast from '../Components/Toast';
import { formatStatusPagamento, daysUntil, formatCurrency } from '../utils/formatDate';
import { getPis } from '../services/piApi';
import './Payments.css';

const API = API_URL;
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
  document.title = 'GPI - Pagamentos';
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
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPi, setFilterPi] = useState('');
  const [filterVencDe, setFilterVencDe] = useState('');
  const [filterVencAte, setFilterVencAte] = useState('');
  const [toast, setToast] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const openedFromParam = useRef(false);
  const navigate = useNavigate();
  const goToPi = (piId) => { if (piId) navigate(`/detalhes/${piId}`); };

  const loadAllPayments = useCallback(async () => {
    const res = await axios.get(`${API}/api/pagamentos`);
    setAllPayments(res.data.data || []);
  }, []);

  const loadTable = useCallback(async (page, term, flt) => {
    setTableLoading(true);
    try {
      const res = await axios.get(`${API}/api/pagamentos`, {
        params: {
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          q: term || undefined,
          status: flt?.status || undefined,
          pi_id: flt?.pi || undefined,
          venc_de: flt?.vencDe || undefined,
          venc_at: flt?.vencAte || undefined
        }
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

  const temFiltros = Boolean(filterStatus || filterPi || filterVencDe || filterVencAte);

  const limparFiltros = () => {
    setFilterStatus('');
    setFilterPi('');
    setFilterVencDe('');
    setFilterVencAte('');
    setCurrentPage(1);
  };

  const filtrosAtuais = () => ({
    status: filterStatus,
    pi: filterPi,
    vencDe: filterVencDe,
    vencAte: filterVencAte
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTable(currentPage, searchTerm, {
        status: filterStatus,
        pi: filterPi,
        vencDe: filterVencDe,
        vencAte: filterVencAte
      });
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, filterStatus, filterPi, filterVencDe, filterVencAte, loadTable]);

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

  // Pagamentos que vencem no dia selecionado no calendário.
  const pagamentosDoDia = enrichedPayments.filter(p =>
    p.dueDate &&
    p.dueDate.getDate() === calendarSelectedDate.getDate() &&
    p.dueDate.getMonth() === calendarSelectedDate.getMonth() &&
    p.dueDate.getFullYear() === calendarSelectedDate.getFullYear()
  );

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
    await Promise.all([loadAllPayments(), loadTable(currentPage, searchTerm, filtrosAtuais())]);
    setToast({ message: 'Pagamento registrado com sucesso!', type: 'success' });
  };

  const handleUpdate = async (payload) => {
    await axios.put(`${API}/api/pagamentos/${selectedPayment.id}`, payload);
    await Promise.all([loadAllPayments(), loadTable(currentPage, searchTerm, filtrosAtuais())]);
    setToast({ message: 'Pagamento atualizado com sucesso!', type: 'success' });
  };

  const handleDelete = async () => {
    await axios.delete(`${API}/api/pagamentos/${selectedPayment.id}`);
    await loadAllPayments();
    if (tablePayments.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else {
      await loadTable(currentPage, searchTerm, filtrosAtuais());
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
                <div className="payments-filtros">
                  <select
                    className="filtro-select"
                    value={filterStatus}
                    onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    title="Filtrar por status"
                  >
                    <option value="">Todos os status</option>
                    <option value="aguardando prazo">Aguardando prazo</option>
                    <option value="em andamento">Em andamento</option>
                    <option value="pago">Pago</option>
                  </select>

                  <select
                    className="filtro-select"
                    value={filterPi}
                    onChange={e => { setFilterPi(e.target.value); setCurrentPage(1); }}
                    title="Filtrar por PI"
                  >
                    <option value="">Todas as PIs</option>
                    {[...pis]
                      .sort((a, b) => (a.titulo || '').localeCompare(b.titulo || ''))
                      .map(pi => (
                        <option key={pi.id} value={pi.id}>{pi.titulo || pi.protocolo || `PI ${pi.id}`}</option>
                      ))}
                  </select>

                  <input
                    type="date"
                    className="filtro-date"
                    value={filterVencDe}
                    onChange={e => { setFilterVencDe(e.target.value); setCurrentPage(1); }}
                    title="Vencimento a partir de"
                  />
                  <span className="filtro-periodo-sep">–</span>
                  <input
                    type="date"
                    className="filtro-date"
                    value={filterVencAte}
                    onChange={e => { setFilterVencAte(e.target.value); setCurrentPage(1); }}
                    title="Vencimento até"
                  />

                  {temFiltros && (
                    <button className="filtro-limpar" onClick={limparFiltros} title="Limpar filtros">
                      <X size={14} /> Limpar
                    </button>
                  )}
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
                         <td className="td-pi">
                           <button className="pi-link" onClick={() => goToPi(p.pi_id)} title="Ver detalhes da PI">
                             {p.pi}
                           </button>
                         </td>
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

            <div className="day-payments-card">
              <h2 className="section-title day-payments-title">
                <CalendarIcon size={14} />
                {calendarSelectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                <span className="day-payments-count">
                  {pagamentosDoDia.length} pagamento{pagamentosDoDia.length !== 1 ? 's' : ''}
                </span>
              </h2>
              {pagamentosDoDia.length === 0 ? (
                <p className="day-payments-empty">
                  Nenhum pagamento vence neste dia.
                </p>
              ) : (
                <div className="day-payments-list">
                  {pagamentosDoDia.map(p => (
                    <button
                      key={p.id}
                      className={`day-payment-item ${p.dueDate < today ? 'day-payment-item--atrasado' : ''}`}
                      onClick={() => handleOpenViewModal(p)}
                      title="Ver detalhes"
                    >
                      <div className="day-payment-left">
                        <span className="day-payment-tipo">{p.tipo_de_pagamento || `Pagamento #${p.id}`}</span>
                        <span className="day-payment-pi">
                          <button className="pi-link pi-link--sm" onClick={(e) => { e.stopPropagation(); goToPi(p.pi_id); }} title="Ver detalhes da PI">
                            {p.pi}
                          </button>
                        </span>
                      </div>
                      <div className="day-payment-right">
                        <span className={`status-badge status-badge--${(p.status || 'aguardando prazo').toLowerCase().replace(/\s+/g, '')}`}>
                          {formatStatusPagamento(p.status)}
                        </span>
                        <span className="day-payment-valor">{formatCurrency(parseFloat(p.valor) || 0)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {upcomingPayments.length > 0 && (
              <div className="upcoming-section">
                <h2 className="section-title">Próximos Vencimentos</h2>
                <div className="upcoming-grid">
                  {upcomingPayments.map((p, i) => (
                    <div key={i} className="upcoming-item">
                      <div className="upcoming-left">
                        <p className="upcoming-title">{p.tipo_de_pagamento || `Pagamento #${p.id}`}</p>
                        <dt className="upcoming-date">
                          <CalendarIcon size={12} />
                          {p.dueDate ? p.dueDate.toLocaleDateString('pt-BR') : '-'}
                        </dt>
                        {renderDaysLeft(p)}
                        {p.data_informada && p.data_informada !== p.data_de_vencimento && (() => {
                          const info = toLocalDate(p.data_informada);
                          return info ? (
                            <dt className="upcoming-date upcoming-date--informada">
                              <Info size={12} />
                              Informada: {info.toLocaleDateString('pt-BR')}
                            </dt>
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
