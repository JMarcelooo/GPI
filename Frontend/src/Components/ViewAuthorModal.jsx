import React from 'react';
import './AuthorModal.css';

const formatPhone = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

const genderLabel = (g) => {
  if (g === 'Nao informado') return 'Não informado';
  return g;
};

export default function ViewAuthorModal({ onClose, author }) {
  const associatedPI = author.PIs || [];

  const infoItems = [
    { label: 'E-mail', value: author.email, icon: '@' },
    { label: 'Telefone', value: formatPhone(author.phone), icon: '' },
    { label: 'Gênero', value: genderLabel(author.gender), icon: '' },
    { label: 'Vínculo', value: author.bond, icon: '' },
    { label: 'Departamento', value: author.department, icon: '' },
    { label: 'Campus', value: author.campus, icon: '' },
    { label: 'Universidade', value: author.university, icon: '' },
  ];

  return (
    <div className="modal-overlay">
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        width: '92vw',
        maxWidth: 1200,
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Hero Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #1a3a7a 100%)',
          padding: 'var(--space-8) var(--space-8) var(--space-6)',
          position: 'relative',
        }}>
          <button onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 20,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              fontSize: 24,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            &times;
          </button>

          <h2 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#fff',
            margin: 0,
            letterSpacing: '-0.5px',
          }}>
            {author.name}
          </h2>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            marginTop: 20,
          }}>
            {infoItems.map(({ label, value }) => (
              <span key={label} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 20,
                fontSize: 13,
                color: 'rgba(255,255,255,0.9)',
              }}>
                <strong style={{ fontWeight: 600, color: '#fff' }}>{label}:</strong>
                {value}
              </span>
            ))}
          </div>
        </div>

        {/* PI section */}
        <div style={{
          padding: 'var(--space-6) var(--space-8)',
          flex: 1,
          overflowY: 'auto',
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--color-primary)',
            margin: '0 0 var(--space-4)',
            paddingBottom: 12,
            borderBottom: '2px solid var(--color-border)',
          }}>
            Propriedades Intelectuais Vinculadas
          </h3>

          {associatedPI.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 'calc(100% - 60px)',
              color: 'var(--color-text-muted)',
              fontSize: 15,
              gap: 12,
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                color: 'var(--color-text-muted)',
              }}>
                &#128196;
              </div>
              <span>Nenhuma propriedade intelectual vinculada a este autor.</span>
            </div>
          ) : (
              <table className="authors-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Protocolo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {associatedPI.map(pi => (
                  <tr key={pi.id}>
                    <td style={{ textTransform: 'capitalize' }}>{pi.titulo}</td>
                    <td>{pi.protocolo}</td>
                    <td>{pi.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
