import React from 'react';
import './AuthorModal.css';

export default function ConfirmDeleteModal({ onClose, onConfirm, authorName }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content-author">
        <div className="modal-header-author">
          <h2>Excluir Autor</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-subtitle">Confirmação</div>
        <p style={{ margin: 'var(--space-4) 0', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Tem certeza que deseja excluir <strong>{authorName}</strong>?
        </p>
        <div className="modal-actions-author">
          <button className="cancel-button" onClick={onClose}>Cancelar</button>
          <button
            className="save-button"
            onClick={onConfirm}
            style={{ background: 'var(--color-error, #dc3545)' }}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
