import React, { useState } from 'react';
import PISelector from './PISelector';
import '../Paginas/Modal.css';

export default function RegisterPaymentModal({ onClose, onRegister }) {
  const [piId, setPiId] = useState(null);
  const [form, setForm] = useState({
    tipo_de_pagamento: '',
    data_de_vencimento: '',
    valor: '',
    observacao: ''
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
      await onRegister({
        pi_id: Number(piId),
        tipo_de_pagamento: form.tipo_de_pagamento,
        data_de_vencimento: form.data_de_vencimento,
        valor: Number(form.valor),
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Registrar Novo Pagamento</h2>
        <form onSubmit={handleSubmit}>
          <label>Propriedade Intelectual</label>
          <PISelector value={piId} onChange={setPiId} />

          <label htmlFor="pay-tipo">Tipo de Pagamento</label>
          <input
            id="pay-tipo"
            type="text"
            name="tipo_de_pagamento"
            value={form.tipo_de_pagamento}
            onChange={handleChange}
            placeholder="Ex.: Anuidade, Manutenção"
            required
          />

          <label htmlFor="pay-valor">Valor (R$)</label>
          <input
            id="pay-valor"
            type="number"
            name="valor"
            min="0"
            step="0.01"
            value={form.valor}
            onChange={handleChange}
            placeholder="0.00"
            required
          />

          <label htmlFor="pay-data">Data</label>
          <input
            id="pay-data"
            type="date"
            name="data_de_vencimento"
            value={form.data_de_vencimento}
            onChange={handleChange}
            required
          />

          <label htmlFor="pay-obs">Observações</label>
          <textarea
            id="pay-obs"
            name="observacao"
            rows="3"
            value={form.observacao}
            onChange={handleChange}
            placeholder="Observações adicionais (opcional)"
          />

          {error && <p style={{ color: '#DC2626', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="confirm-btn">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
