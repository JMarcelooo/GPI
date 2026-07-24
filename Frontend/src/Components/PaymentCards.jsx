import React from 'react';
import { Clock, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import '../Paginas/Payments.css';

export default function PaymentCards() {
  return (
    <div className="cards-wrapper">
      <div className="payment-card" style={{ backgroundColor: '#ece7fc' }}>
        <span className="icon"><Clock size={24} /></span>
        <div>
          <h3>Pagamentos Pendentes</h3>
          <p>0 — <strong>R$ 0,00</strong></p>
        </div>
      </div>
      <div className="payment-card" style={{ backgroundColor: '#e9fbe6' }}>
        <span className="icon"><CheckCircle size={24} /></span>
        <div>
          <h3>Pagamentos Realizados</h3>
          <p>0 — <strong>R$ 0,00</strong></p>
        </div>
      </div>
      <div className="payment-card" style={{ backgroundColor: '#ffe8e8' }}>
        <span className="icon"><AlertTriangle size={24} /></span>
        <div>
          <h3>Pagamentos Atrasados</h3>
          <p>0 — <strong>R$ 0,00</strong></p>
        </div>
      </div>
      <div className="payment-card" style={{ backgroundColor: '#f7ecfc' }}>
        <span className="icon"><DollarSign size={24} /></span>
        <div>
          <h3>Total de Pagamentos</h3>
          <p>0 — <strong>R$ 0,00</strong></p>
        </div>
      </div>
    </div>
  );
}
