import { useNavigate } from 'react-router-dom';
import { X, Tag, FileText, DollarSign, Calendar, ShieldCheck, Timer, ExternalLink } from 'lucide-react';
import { formatStatusPagamento, daysUntil, formatCurrency, formatDate } from '../utils/formatDate';
import './ViewPaymentModal.css';

export default function ViewPaymentModal({ payment, onClose }) {
  const navigate = useNavigate();
  if (!payment) return null;

  const goToPi = () => {
    if (payment.pi_id) {
      onClose();
      navigate(`/detalhes/${payment.pi_id}`);
    }
  };

  const diff = daysUntil(payment.data_de_vencimento);
  let diffText = null;
  let diffClass = '';
  if (diff !== null && diff !== undefined) {
    if (diff > 0) { diffText = `Vence em ${diff} dia${diff !== 1 ? 's' : ''}`; diffClass = 'vp-diff--ok'; }
    else if (diff === 0) { diffText = 'Vence hoje'; diffClass = 'vp-diff--warn'; }
    else { const a = Math.abs(diff); diffText = `Venceu há ${a} dia${a !== 1 ? 's' : ''}`; diffClass = 'vp-diff--late'; }
  }

  const statusKey = (payment.status || 'aguardando prazo').toLowerCase().replace(/\s+/g, '');
  const piLabel = payment.pi || (payment.pi_id ? `PI ${payment.pi_id}` : '-');

  return (
    <div className="vp-overlay" onClick={onClose}>
      <div className="vp-modal" onClick={(e) => e.stopPropagation()}>
        <header className="vp-header">
          <div className="vp-header-main">
            <span className="vp-eyebrow"><Tag size={14} /> Tipo de pagamento</span>
            <h2 className="vp-title">{payment.tipo_de_pagamento || `Pagamento #${payment.id}`}</h2>
          </div>
          <button className="vp-close" onClick={onClose} title="Fechar"><X size={20} /></button>
        </header>

        <div className="vp-status-row">
          <span className={`status-badge status-badge--${statusKey}`}>
            {formatStatusPagamento(payment.status)}
          </span>
          {diffText && <span className={`vp-diff ${diffClass}`}>{diffText}</span>}
        </div>

        <div className="vp-body">
          <div className="vp-field vp-field--pi">
            <span className="vp-label"><FileText size={14} /> Propriedade Intelectual</span>
            <button className="vp-pi-link" onClick={goToPi} title="Abrir detalhes da PI">
              {piLabel}
              <ExternalLink size={15} />
            </button>
          </div>

          <div className="vp-grid">
            <div className="vp-field">
              <span className="vp-label"><DollarSign size={14} /> Valor</span>
              <p className="vp-value">{formatCurrency(payment.valor)}</p>
            </div>
            <div className="vp-field">
              <span className="vp-label"><Calendar size={14} /> Data calculada</span>
              <p className="vp-text">{formatDate(payment.data_de_vencimento)}</p>
              <p className="vp-sub">Informada: {formatDate(payment.data_informada)}</p>
            </div>
            <div className="vp-field">
              <span className="vp-label"><ShieldCheck size={14} /> Processo SEI</span>
              <p className="vp-text">{payment.processo_sei || '-'}</p>
            </div>
            <div className="vp-field">
              <span className="vp-label"><Timer size={14} /> Prazo</span>
              <p className="vp-text">
                {payment.prazo_dias ? `${payment.prazo_dias} dia${payment.prazo_dias !== 1 ? 's' : ''}` : '-'}
                {diffText && <span className={`vp-diff ${diffClass}`}> · {diffText}</span>}
              </p>
            </div>
          </div>

          <div className="vp-field">
            <span className="vp-label"><FileText size={14} /> Observações</span>
            <p className="vp-obs">{payment.observacao || 'Nenhuma observação.'}</p>
          </div>
        </div>

        <footer className="vp-footer">
          <button className="vp-btn-ghost" onClick={onClose}>Fechar</button>
          <button className="vp-btn-primary" onClick={goToPi}>
            <ExternalLink size={16} /> Ver PI
          </button>
        </footer>
      </div>
    </div>
  );
}
