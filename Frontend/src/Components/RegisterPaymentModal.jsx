import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag, DollarSign, Calendar, Timer, ShieldCheck, FileText, Wallet } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const hasPrazo = form.prazo_dias !== '' && form.prazo_dias !== null && !isNaN(Number(form.prazo_dias)) && Number(form.prazo_dias) > 0;
  const dataInformada = form.data_informada || todayString();
  const dataCalculada = hasPrazo ? addDaysToDate(dataInformada, form.prazo_dias) : null;
  const vencPreview = hasPrazo && dataCalculada ? new Date(dataCalculada).toLocaleDateString('pt-BR') : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!piId) {
      setError('Selecione uma PI.');
      return;
    }
    if (saving) return;
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="modal-overlay modal-overlay--pay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Registrar pagamento">
      <div className="modal modal--pay" onClick={e => e.stopPropagation()}>
        <header className="modal-header-pay">
          <div>
            <span className="modal-eyebrow"><Wallet size={14} /> Novo pagamento</span>
            <h2>Registrar Pagamento</h2>
            <p className="modal-subtitle">
              {hasPrazo && vencPreview ? <>Vencimento: <strong>{vencPreview}</strong> · {form.prazo_dias} dias</> : 'Informe o prazo para calcular o vencimento'}
            </p>
          </div>
          <button className="modal-close-icon" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body-pay">
          <div className="form-grid form-grid--pay">
            <div className="form-group form-group--full">
              <label>Propriedade Intelectual *</label>
              <PISelector value={piId} onChange={setPiId} />
            </div>

            <div className="form-group">
              <label htmlFor="pay-tipo"><Tag size={12} /> Tipo de Pagamento *</label>
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
            </div>

            <div className="form-group">
              <label htmlFor="pay-valor"><DollarSign size={12} /> Valor (R$) *</label>
              <input
                id="pay-valor"
                type="number"
                name="valor"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={handleChange}
                placeholder="0,00"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pay-data"><Calendar size={12} /> Data informada</label>
              <input
                id="pay-data"
                type="date"
                name="data_informada"
                value={form.data_informada}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pay-prazo"><Timer size={12} /> Prazo (dias)</label>
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
            </div>

            <div className="form-group form-group--full">
              <label htmlFor="pay-status"><FileText size={12} /> Status</label>
              <div className="segmented">
                {STATUS_PAGAMENTO.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`segmented-btn ${form.status===s?'is-active':''}`}
                    onClick={() => setForm(prev=>({...prev, status:s}))}
                    aria-pressed={form.status===s}
                  >{s.charAt(0).toUpperCase()+s.slice(1)}</button>
                ))}
              </div>
            </div>

            <div className="form-group form-group--full">
              <label htmlFor="pay-sei"><ShieldCheck size={12} /> Processo SEI</label>
              <input
                id="pay-sei"
                type="text"
                name="processo_sei"
                value={form.processo_sei}
                onChange={handleChange}
                placeholder="Número do processo SEI (opcional)"
                maxLength={1000}
              />
              <span className="form-hint">{form.processo_sei.length}/1000</span>
            </div>

            <div className="form-group form-group--full">
              <label htmlFor="pay-obs"><FileText size={12} /> Observações</label>
              <textarea
                id="pay-obs"
                name="observacao"
                rows="3"
                value={form.observacao}
                onChange={handleChange}
                placeholder="Observações adicionais (opcional)"
                maxLength={5000}
              />
              <span className="form-hint">{form.observacao.length}/5000</span>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="confirm-btn" disabled={saving}>{saving ? 'Registrando...' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
