import { Calendar } from 'lucide-react';
import './PaymentList.css';

const PaymentList = ({ payments, monthName, year }) => {
  const formatCurrency = (amount) => {
    return `R$ ${Number(amount || 0).toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="payment-list-container">
      <h3>Pagamentos de {monthName} {year}</h3>
      <div className="payment-items">
        {payments.length > 0 ? (
          payments.map(payment => (
            <div key={payment.id} className="payment-item">
              <div className="payment-details">
                <p className="description">{payment.tipo_de_pagamento || `Pagamento #${payment.id}`}</p>
                <div className="date-and-course">
                  <Calendar size={14} className="date-icon" />
                  <span>Data: {formatDate(payment.dueDate)}</span>
                  <span>{payment.pi}</span>
                </div>
              </div>
              <div className="payment-amount">
                {formatCurrency(payment.valor)}
              </div>
            </div>
          ))
        ) : (
          <p>Nenhum pagamento para este mês.</p>
        )}
      </div>
    </div>
  );
};

export default PaymentList;
