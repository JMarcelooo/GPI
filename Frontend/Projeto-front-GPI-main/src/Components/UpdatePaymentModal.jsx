import React from 'react';
import '../Paginas/Modal.css';

export default function UpdatePaymentModal({ payment, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Atualizar Status de Pagamento</h2>

        <p><strong>Propriedade Intelectual:</strong> {payment.pi}</p>
        <p><strong>Tipo de Pagamento:</strong> {payment.tipo}</p>
        <p><strong>Valor (R$):</strong> {payment.valor}</p>

        <label>Status do Pagamento</label>
        <select>
          <option>Pago</option>
          <option>Pendente</option>
          <option>Atrasado</option>
        </select>

        <label>Data de vencimento</label>
        <input type="date" />

        <label>Observações</label>
        <textarea defaultValue="Pagamento realizado pelo departamento financeiro" />

        <div className="modal-actions">
          <button onClick={onClose} className="cancel-btn">Cancelar</button>
          <button className="confirm-btn">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
}
