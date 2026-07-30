
import { Calendar } from 'lucide-react';
import './PaymentList.css'; // Estilos específicos da lista de pagamentos

const PaymentList = ({ payments, monthName, year }) => {
  const formatCurrency = (amount) => {
    return `R$ ${amount.toFixed(2).replace('.', ',')}`; // Formata para BRL
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses são 0-indexados, então +1
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="payment-list-container">
      <h3>Pagamentos de {monthName} {year}</h3>
      <div className="payment-items">
        {payments.length > 0 ? (
          payments.map(payment => (
            <div key={payment.id} className={`payment-item status-${payment.status.replace(/\s/g, '')}`}>
              <div className="payment-details">
                <p className="description">{payment.description}</p>
                <div className="date-and-course">
                  <Calendar size={14} className="date-icon" />
                  <span>Vencimento: {formatDate(payment.dueDate)}</span>
                  <span>{payment.course}</span>
                </div>
              </div>
              <div className="payment-amount">
                {formatCurrency(payment.amount)}
              </div>
              <div className={`payment-status status-${payment.status.replace(/\s/g, '')}`}>
                {payment.status}
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