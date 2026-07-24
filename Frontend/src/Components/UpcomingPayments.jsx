import React from 'react';
import '../Paginas/Payments.css';

export default function UpcomingPayments({ onRegister, payments = [] }) {
  return (
    <div className="upcoming-section">
      <div className="upcoming-header">
        <h2>Próximos Pagamentos</h2>
      </div>

      {payments.length === 0 && <p style={{ padding: 16, color: '#888' }}>Nenhum pagamento próximo</p>}

      {payments.map((p, i) => (
        <div className="upcoming-card" key={i}>
          <div>
            <h3>{p.title}</h3>
            <p>{p.sub}</p>
          </div>
          <div className="payment-right">
            <p><strong>{p.value}</strong></p>
            <span>Vencimento: {p.due}</span>
          </div>
        </div>
      ))}

      <button className="register-button" onClick={onRegister}>
        + Registrar Novo Pagamento
      </button>
    </div>
  );
}
