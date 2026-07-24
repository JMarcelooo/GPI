import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import PaymentCards from '../Components/PaymentCards';
import UpcomingPayments from '../Components/UpcomingPayments';
import PaymentTable from '../Components/PaymentTable';
import RegisterPaymentModal from '../Components/RegisterPaymentModal';
import UpdatePaymentModal from '../Components/UpdatePaymentModal';
import Calendar from '../Components/Calendar'; // NOVO: Componente Calendar
import PaymentList from '../Components/PaymentList'; // NOVO: Componente PaymentList

// Caminho CORRIGIDO para o CSS: se Payments.jsx está em src/Paginas, e Payments.css está em src/Paginas,
// o caminho deve ser relativo à própria pasta: './Payments.css'
import './Payments.css'; 

export default function Payments() {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // Estado para controlar a aba ativa: 'list' ou 'calendar'

  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [allPayments, setAllPayments] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/pagamentos`)
      .then(res => setAllPayments(res.data.data || []))
      .catch(err => console.error("Erro ao buscar pagamentos:", err));
  }, []);

  const getPaymentsForCalendarMonth = (year, month) => {
    return allPayments.filter(payment =>
      new Date(payment.dueDate).getFullYear() === year &&
      new Date(payment.dueDate).getMonth() === month
    );
  };

  const currentMonthPayments = getPaymentsForCalendarMonth(
    calendarSelectedDate.getFullYear(),
    calendarSelectedDate.getMonth()
  );

  const handleOpenUpdateModal = (payment) => {
    setSelectedPayment(payment);
    setShowUpdateModal(true);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="payments-container">
      <Sidebar />

      <div className="content">
        <h1 className="title">Gestão de Pagamentos</h1>

        <PaymentCards />

        <header className="dashboard-header-payments">
          <button className="register-button-payments" onClick={() => setShowRegisterModal(true)}>
            <span className="plus-icon">+</span> Registrar Novo Pagamento
          </button>
        </header>

        <UpcomingPayments onRegister={() => setShowRegisterModal(true)} />

        <div className="tabs-container">
          <button
            className={activeTab === 'list' ? 'active-tab' : ''}
            onClick={() => setActiveTab('list')}
          >
            Lista de Pagamentos
          </button>
          <button
            className={activeTab === 'calendar' ? 'active-tab' : ''}
            onClick={() => setActiveTab('calendar')}
          >
            Calendário de Pagamentos
          </button>
        </div>

        {activeTab === 'list' ? (
          <PaymentTable onEdit={(payment) => handleOpenUpdateModal(payment)} />
        ) : (
          <div className="calendar-section">
            <div className="calendar-header">
              <CalendarIcon size={24} className="calendar-icon" />
              <h2>Calendário de Pagamentos</h2>
            </div>
            <div className="calendar-and-list-container">
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