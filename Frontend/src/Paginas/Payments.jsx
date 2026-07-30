import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Search, List, BarChart3 } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Calendar from '../Components/Calendar';
import PaymentList from '../Components/PaymentList';
import RegisterPaymentModal from '../Components/RegisterPaymentModal';
import UpdatePaymentModal from '../Components/UpdatePaymentModal';
import './Payments.css';

export default function Payments() {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [allPayments, setAllPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/pagamentos`)
      .then(res => setAllPayments(res.data.data || []))
      .catch(err => console.error("Erro ao buscar pagamentos:", err));
  }, []);

  const stats = {
    total: allPayments.length,
    pendentes: allPayments.filter(p => p.status === 'pendente').length,
    realizados: allPayments.filter(p => p.status === 'pago').length,
    atrasados: allPayments.filter(p => p.status === 'atrasado').length,
    valorPendente: allPayments
      .filter(p => p.status === 'pendente' || p.status === 'atrasado')
      .reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
    valorRealizado: allPayments
      .filter(p => p.status === 'pago')
      .reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
  };

  const formatCurrency = (val) =>
    `R$ ${val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

  const getPaymentsForCalendarMonth = (year, month) =>
    allPayments.filter(p =>
      new Date(p.dueDate).getFullYear() === year &&
      new Date(p.dueDate).getMonth() === month
    );

  const currentMonthPayments = getPaymentsForCalendarMonth(
    calendarSelectedDate.getFullYear(),
    calendarSelectedDate.getMonth()
  );

  const upcomingPayments = [...allPayments]
    .filter(p => p.status !== 'pago')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const handleOpenUpdateModal = (payment) => {
    setSelectedPayment(payment);
    setShowUpdateModal(true);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="payments-page">
      <Sidebar />
      <div className="payments-content">
        <div className="payments-header">
          <div>
            <h1 className="payments-title">Gestão de Pagamentos</h1>
            <p className="payments-subtitle">
              {allPayments.length} registro{allPayments.length !== 1 ? 's' : ''} encontrado{allPayments.length !== 1 ? 's' : ''}
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
            </div>
          </div>
          <div className="stat-card stat-card--pending">
            <div className="stat-icon" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              <List size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.pendentes}</span>
              <span className="stat-label">Pendentes</span>
              <span className="stat-amount">{formatCurrency(stats.valorPendente)}</span>
            </div>
          </div>
          <div className="stat-card stat-card--paid">
            <div className="stat-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <List size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.realizados}</span>
              <span className="stat-label">Realizados</span>
              <span className="stat-amount">{formatCurrency(stats.valorRealizado)}</span>
            </div>
          </div>
          <div className="stat-card stat-card--overdue">
            <div className="stat-icon" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
              <List size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.atrasados}</span>
              <span className="stat-label">Atrasados</span>
            </div>
          </div>
        </div>

        {upcomingPayments.length > 0 && (
          <div className="upcoming-section">
            <h2 className="section-title">Próximos Vencimentos</h2>
            <div className="upcoming-grid">
              {upcomingPayments.map((p, i) => (
                <div key={i} className="upcoming-item">
                  <div className="upcoming-left">
                    <p className="upcoming-title">{p.description || `Pagamento #${p.id}`}</p>
                    <span className="upcoming-date">
                      <CalendarIcon size={12} />
                      {new Date(p.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="upcoming-right">
                    <span className={`upcoming-status status-${(p.status || '').toLowerCase().replace(/\s/g, '')}`}>
                      {p.status}
                    </span>
                    <span className="upcoming-value">
                      {formatCurrency(parseFloat(p.amount) || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="payments-tabs">
          <button
            className={`tab-btn ${activeTab === 'list' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <List size={16} /> Lista
          </button>
          <button
            className={`tab-btn ${activeTab === 'calendar' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarIcon size={16} /> Calendário
          </button>
        </div>

        {activeTab === 'list' ? (
          <div className="table-section">
            <div className="table-toolbar">
              <div className="search-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar pagamentos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="table-scroll">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>PI</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments
                    .filter(p => !searchTerm || (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((p, i) => (
                      <tr key={i}>
                        <td className="td-desc">{p.description || `Pagamento #${p.id}`}</td>
                        <td>{p.pi || '-'}</td>
                        <td className="td-value">{formatCurrency(parseFloat(p.amount) || 0)}</td>
                        <td>{p.dueDate ? new Date(p.dueDate).toLocaleDateString('pt-BR') : '-'}</td>
                        <td>
                          <span className={`status-badge status-badge--${(p.status || '').toLowerCase().replace(/\s/g, '')}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <button className="edit-btn" onClick={() => handleOpenUpdateModal(p)}>
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="calendar-view">
            <Calendar
              selectedDate={calendarSelectedDate}
              setSelectedDate={setCalendarSelectedDate}
              payments={currentMonthPayments}
            />
            <PaymentList
              payments={currentMonthPayments}
              monthName={monthNames[calendarSelectedDate.getMonth()]}
              year={calendarSelectedDate.getFullYear()}
            />
          </div>
        )}

        {showRegisterModal && (
          <RegisterPaymentModal onClose={() => setShowRegisterModal(false)} />
        )}
        {showUpdateModal && (
          <UpdatePaymentModal
            payment={selectedPayment}
            onClose={() => setShowUpdateModal(false)}
          />
        )}
      </div>
    </div>
  );
}
