import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import PISelector from './PISelector';
import { STATUS_PAGAMENTO } from '../utils/formatDate';
import '../Paginas/Modal.css';

export default function UpdatePaymentModal({ payment, onClose, onUpdate, onDelete }) {
  const [piId, setPiId] = useState(payment.pi_id);
  const [form, setForm] = useState({
    tipo_de_pagamento: payment.tipo_de_pagamento || '',
    data_de_vencimento: payment.data_de_vencimento || '',
    valor: payment.valor ?? '',
    status: payment.status || 'aguardando prazo',
    processo_sei: payment.processo_sei || '',
    observacao: payment.observacao || ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!piId) {
      setError('Selecione uma PI.');
      return;
    }
    try {
      await onUpdate({
        pi_id: Number(piId),
        tipo_de_pagamento: form.tipo_de_pagamento,
        data_de_vencimento: form.data_de_vencimento,
        valor: Number(form.valor),
        status: form.status,
        processo_sei: form.processo_sei,
        observacao: form.observacao
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.errors?.join(', ') ||
        err.response?.data?.error ||
        'Erro de conexão com o servidor'
      );
    }
  };

  const handleDelete = async () => {
    setError('');
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Erro ao remover pagamento.'
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Editar Pagamento</h2>

        <PISelector value={piId} onChange={setPiId} />

        <form onSubmit={handleSubmit}>
          <label htmlFor="pay-tipo-edit">Tipo de Pagamento</label>
          <input
            id="pay-tipo-edit"
            type="text"
            name="tipo_de_pagamento"
            value={form.tipo_de_pagamento}
            onChange={handleChange}
            required
          />

          <label htmlFor="pay-valor-edit">Valor (R$)</label>
          <input
            id="pay-valor-edit"
            type="number"
            name="valor"
            min="0"
            step="0.01"
            value={form.valor}
            onChange={handleChange}
            required
          />

          <label htmlFor="pay-data-edit">Data</label>
          <input
            id="pay-data-edit"
            type="date"
            name="data_de_vencimento"
            value={form.data_de_vencimento}
            onChange={handleChange}
            required
          />

          <label htmlFor="pay-status-edit">Status</label>
          <select
            id="pay-status-edit"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            {STATUS_PAGAMENTO.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <label htmlFor="pay-sei-edit">Processo SEI</label>
          <input
            id="pay-sei-edit"
            type="text"
            name="processo_sei"
            value={form.processo_sei}
            onChange={handleChange}
            placeholder="Número do processo SEI (opcional)"
          />

          <label htmlFor="pay-obs-edit">Observações</label>
          <textarea
            id="pay-obs-edit"
            name="observacao"
            rows="3"
            value={form.observacao}
            onChange={handleChange}
            placeholder="Observações adicionais (opcional)"
          />

          {error && <p style={{ color: '#DC2626', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="confirm-btn"
              style={{ background: '#EF4444', marginRight: 'auto' }}
              onClick={handleDelete}
            >
              <Trash2 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Excluir
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="confirm-btn">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}
