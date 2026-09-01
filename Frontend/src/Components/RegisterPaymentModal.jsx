import React, { useState } from 'react';
import PISelector from './PISelector';
import { STATUS_PAGAMENTO, addDaysToDate, todayString } from '../utils/formatDate';
import '../Paginas/Modal.css';

export default function RegisterPaymentModal({ onClose, onRegister }) {
  const [piId, setPiId] = useState(null);
  const [form, setForm] = useState({
    tipo_de_pagamento: '',
    data_informada: '',
    valor: '',
    status: 'aguardando prazo',
    prazo_dias: '',
    processo_sei: '',
    observacao: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const dataInformada = form.data_informada || todayString();
  const dataCalculada = addDaysToDate(dataInformada, form.prazo_dias);

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
        data_informada: dataInformada,
        data_de_vencimento: dataCalculada,
        valor: Number(form.valor),
        status: form.status,
        prazo_dias: form.prazo_dias ? Number(form.prazo_dias) : null,
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
            placeholder="Ex.: Depósito, Anuidade"
            maxLength={255}
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

          <label htmlFor="pay-data">Data Informada</label>
          <input
            id="pay-data"
            type="date"
            name="data_informada"
            value={form.data_informada}
            onChange={handleChange}
          />

          <label htmlFor="pay-prazo">Prazo (dias)</label>
          <input
            id="pay-prazo"
            type="number"
            name="prazo_dias"
            min="1"
            step="1"
            value={form.prazo_dias}
            onChange={handleChange}
            placeholder="Ex.: 60"
          />

          <label htmlFor="pay-status">Status</label>
          <select
            id="pay-status"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            {STATUS_PAGAMENTO.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <label htmlFor="pay-sei">Processo SEI</label>
          <input
            id="pay-sei"
            type="text"
            name="processo_sei"
            value={form.processo_sei}
            onChange={handleChange}
            placeholder="Número do processo SEI (opcional)"
            maxLength={1000}
          />

          <label htmlFor="pay-obs">Observações</label>
          <textarea
            id="pay-obs"
            name="observacao"
            rows="3"
            value={form.observacao}
            onChange={handleChange}
            placeholder="Observações adicionais (opcional)"
            maxLength={5000}
          />

          {error && <p style={{ color: 'var(--color-error)', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="confirm-btn">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
