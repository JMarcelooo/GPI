import React from 'react';
import '../Paginas/Modal.css';

export default function RegisterPaymentModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Registrar Novo Pagamento</h2>

        <label>Propriedade Intelectual</label>
        <select><option>Selecione a PI</option></select>

        <label>Tipo de Pagamento</label>
        <select><option>Selecione o tipo</option></select>

        <label>Valor (R$)</label>
        <input type="number" placeholder="0.00" />

        <label>Data de vencimento</label>
        <input type="date" />

        <label>Observações</label>
        <textarea placeholder="Observações adicionais (opcional)" />

        <div className="modal-actions">
          <button onClick={onClose} className="cancel-btn">Cancelar</button>
          <button className="confirm-btn">Registrar</button>
        </div>
      </div>
    </div>
  );
}
