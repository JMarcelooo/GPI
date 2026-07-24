import React from 'react';
import { Pencil } from 'lucide-react';
import '../Paginas/Payments.css';

export default function PaymentTable({ onEdit, pagamentos = [] }) {

  return (
    <div className="payment-table">
      <input
        type="text"
        className="search-input"
        placeholder="Buscar por nome, tipo, autor ou protocolo"
      />
      <button className="filter-button">Filtros</button>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>PI</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pagamentos.map((p, index) => (
            <tr key={index}>
              <td>{p.id}</td>
              <td>{p.pi}</td>
              <td>{p.tipo}</td>
              <td>{p.valor}</td>
              <td>{p.vencimento}</td>
              <td><span className="status pago">{p.status}</span></td>
              <td>
                <button className="edit-btn" onClick={() => onEdit(p)}><Pencil size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
