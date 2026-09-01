import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Tag, FileText, DollarSign, Calendar, ShieldCheck, Timer, ExternalLink, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { formatStatusPagamento, daysUntil, formatCurrency, formatDate } from '../utils/formatDate';
import './ViewPaymentModal.css';

export default function ViewPaymentModal({ payment, onClose }) {
  const navigate = useNavigate();
  const [obsExpanded, setObsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!payment) return;
    setObsExpanded(false);
    setCopied(false);
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [payment, onClose]);

  if (!payment) return null;

  const goToPi = () => {
    if (payment.pi_id) {
      onClose();
      navigate(`/detalhes/${payment.pi_id}`);
    }
  };

  const statusNorm = (payment.status || 'aguardando prazo').toLowerCase().trim();
  const showDiff = statusNorm === 'em andamento';
  const diff = showDiff ? daysUntil(payment.data_de_vencimento) : null;
  let diffText = null;
  let diffClass = '';
  if (showDiff && diff !== null && diff !== undefined) {
    if (diff > 0) { diffText = `Vence em ${diff} dia${diff !== 1 ? 's' : ''}`; diffClass = 'vp-diff--ok'; }
    else if (diff === 0) { diffText = 'Vence hoje'; diffClass = 'vp-diff--warn'; }
    else { const a = Math.abs(diff); diffText = `Venceu há ${a} dia${a !== 1 ? 's' : ''}`; diffClass = 'vp-diff--late'; }
  }

  const statusKey = (payment.status || 'aguardando prazo').toLowerCase().replace(/\s+/g, '');
  const piLabel = payment.pi || (payment.pi_id ? `PI ${payment.pi_id}` : '-');
  const sei = (payment.processo_sei || '').trim();
  const observacao = (payment.observacao || '').trim();
  const obsLong = observacao.length > 180 || observacao.split('\n').length > 3;

  const handleCopySei = async () => {
    if (!sei) return;
    try {
      await navigator.clipboard.writeText(sei);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // fallback: select
    }
  };

  const content = (
    <div className="vp-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Detalhes do pagamento">
      <div className="vp-modal vp-modal--new" onClick={(e) => e.stopPropagation()}>
        <header className="vp-header vp-header--new">
          <div className="vp-header-main">
            <span className="vp-eyebrow"><Tag size={14} /> Pagamento</span>
            <h2 className="vp-title" title={payment.tipo_de_pagamento}>{payment.tipo_de_pagamento || `Pagamento #${payment.id}`}</h2>
            <div className="vp-meta">
              <span className={`status-badge status-badge--${statusKey}`}>{formatStatusPagamento(payment.status)}</span>
              {diffText && <span className={`vp-diff ${diffClass}`}>{diffText}</span>}
            </div>
          </div>
          <button className="vp-close" onClick={onClose} title="Fechar" aria-label="Fechar"><X size={18} /></button>
        </header>

        <div className="vp-body vp-body--new">
          {/* PI — único ponto de acesso à PI (remove redundância do footer) */}
          <button type="button" className="vp-pi-card" onClick={goToPi} disabled={!payment.pi_id} title={payment.pi_id ? 'Abrir detalhes da PI' : undefined}>
            <span className="vp-pi-icon"><FileText size={18} /></span>
            <span className="vp-pi-info">
              <span className="vp-pi-k">Propriedade Intelectual</span>
              <span className="vp-pi-v" title={piLabel}>{piLabel}</span>
            </span>
            {payment.pi_id && <ExternalLink size={16} className="vp-pi-arrow" />}
          </button>

          <div className="vp-grid vp-grid--new">
            <div className="vp-field">
              <span className="vp-label"><DollarSign size={13} /> Valor</span>
              <p className="vp-value">{formatCurrency(payment.valor)}</p>
            </div>
            <div className="vp-field">
              <span className="vp-label"><Calendar size={13} /> Vencimento</span>
              <p className="vp-text vp-text--strong">{formatDate(payment.data_de_vencimento) || '-'}</p>
              <p className="vp-sub">Informada: {formatDate(payment.data_informada) || '-'}</p>
            </div>
            <div className="vp-field vp-field--sei">
              <span className="vp-label"><ShieldCheck size={13} /> Processo SEI</span>
              {sei ? (
                <div className="vp-sei-row">
                  <span className="vp-sei-value" title={sei}>{sei}</span>
                  <button type="button" className={`vp-copy ${copied ? 'is-copied' : ''}`} onClick={handleCopySei} title={copied ? 'Copiado!' : 'Copiar SEI'} aria-label="Copiar processo SEI">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              ) : (
                <p className="vp-text vp-text--muted">—</p>
              )}
            </div>
            <div className="vp-field">
              <span className="vp-label"><Timer size={13} /> Prazo</span>
              <p className="vp-text vp-text--strong">{payment.prazo_dias ? `${payment.prazo_dias} dia${payment.prazo_dias !== 1 ? 's' : ''}` : '—'}</p>
              {diffText && <span className={`vp-diff ${diffClass}`} style={{ fontSize: 12 }}>{diffText}</span>}
            </div>
          </div>

          <div className="vp-field vp-field--obs">
            <span className="vp-label"><FileText size={13} /> Observações</span>
            <div className={`vp-obs-box ${obsExpanded ? 'is-expanded' : ''} ${!observacao ? 'is-empty' : ''}`}>
              <p className="vp-obs-text">{observacao || 'Nenhuma observação.'}</p>
            </div>
            {obsLong && observacao && (
              <button type="button" className="vp-obs-toggle" onClick={() => setObsExpanded(v => !v)}>
                {obsExpanded ? <><ChevronUp size={14} /> Ver menos</> : <><ChevronDown size={14} /> Ver mais</>}
              </button>
            )}
          </div>
        </div>

        <footer className="vp-footer vp-footer--single">
          <button className="vp-btn-ghost" onClick={onClose}>Fechar</button>
        </footer>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
