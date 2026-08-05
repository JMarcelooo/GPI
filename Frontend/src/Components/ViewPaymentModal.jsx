import { Calendar, DollarSign, FileText, Tag, ShieldCheck, Timer } from 'lucide-react';
import { formatStatusPagamento, daysUntil } from '../utils/formatDate';
import '../Paginas/Modal.css';

const formatCurrency = (val) =>
  `R$ ${Number(val || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

const formatDate = (date) => {
  if (!date) return '-';
  if (date instanceof Date && !isNaN(date)) return date.toLocaleDateString('pt-BR');
  const d = new Date(String(date).slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
};

export default function ViewPaymentModal({ payment, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Detalhes do Pagamento</h2>

        <div style={{ margin: '16px 0', padding: '20px', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Tag size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Tipo de Pagamento
            </span>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--color-text)', fontWeight: 600 }}>
            {payment.tipo_de_pagamento || '-'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FileText size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Propriedade Intelectual
            </span>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--color-text)' }}>
            {payment.pi || '-'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <DollarSign size={16} style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Valor
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text)', fontWeight: 700 }}>
                {formatCurrency(payment.valor)}
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Data Calculada
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text)', fontWeight: 600 }}>
                {formatDate(payment.dueDate || payment.data_de_vencimento)}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Informada: {formatDate(payment.data_informada || payment.data_de_vencimento)}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Tag size={16} style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Status
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                {formatStatusPagamento(payment.status)}
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Processo SEI
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                {payment.processo_sei || '-'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Timer size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Prazo
            </span>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--color-text)' }}>
            {payment.prazo_dias ? `${payment.prazo_dias} dia${payment.prazo_dias !== 1 ? 's' : ''}` : '-'}
            {payment.prazo_dias && payment.data_de_vencimento && (() => {
              const diff = daysUntil(payment.data_de_vencimento);
              if (diff === null) return null;
              if (diff > 0) return <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{` · Vence em ${diff} dia${diff !== 1 ? 's' : ''}`}</span>;
              if (diff === 0) return <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>{' · Vence hoje'}</span>;
              const abs = Math.abs(diff);
              return <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>{` · Venceu há ${abs} dia${abs !== 1 ? 's' : ''}`}</span>;
            })()}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FileText size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Observações
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
            {payment.observacao || '-'}
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
