import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import '../Paginas/Modal.css';

const AdicionarRPIModal = ({ isOpen, onClose, onAddRPI, onUpdateRPI, onDeleteRPI, event }) => {
  const [data, setData] = useState(event ? event.data : '');
  const [codigoEvento, setCodigoEvento] = useState(event ? String(event.codigo_evento) : '');
  const [descricao, setDescricao] = useState(event ? event.descricao_do_evento : '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setData(event ? event.data : '');
    setCodigoEvento(event ? String(event.codigo_evento) : '');
    setDescricao(event ? event.descricao_do_evento : '');
    setConfirmingDelete(false);
  }, [isOpen, event]);

  if (!isOpen) return null;

  const isEditing = !!event;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      data,
      codigo_evento: Number(codigoEvento),
      descricao_do_evento: descricao
    };
    if (isEditing && onUpdateRPI) {
      onUpdateRPI(payload);
    } else if (onAddRPI) {
      onAddRPI(payload);
    }
    setData('');
    setCodigoEvento('');
    setDescricao('');
    onClose();
  };

  const handleDelete = () => {
    if (confirmingDelete) {
      if (onDeleteRPI) {
        onDeleteRPI();
      }
      setData('');
      setCodigoEvento('');
      setDescricao('');
      onClose();
    } else {
      setConfirmingDelete(true);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{isEditing ? 'Editar RPI' : 'Adicionar RPI'}</h2>
        <form onSubmit={handleSubmit}>
          {confirmingDelete ? (
            <>
              <div style={{ margin: 'var(--space-4) 0', padding: 'var(--space-4)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ margin: 0, color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}>
                  Tem certeza que deseja excluir este evento RPI? Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="confirm-btn"
                  style={{ background: '#EF4444' }}
                  onClick={handleDelete}
                >
                  <Trash2 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Confirmar exclusão
                </button>
              </div>
            </>
          ) : (
            <>
          <label htmlFor="rpi-data">Data</label>
          <input
            type="date"
            id="rpi-data"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />

          <label htmlFor="rpi-codigo">Código do Evento</label>
          <input
            type="number"
            id="rpi-codigo"
            value={codigoEvento}
            onChange={(e) => setCodigoEvento(e.target.value)}
            placeholder="Ex.: 123"
            required
          />

          <label htmlFor="rpi-descricao">Descrição</label>
          <textarea
            id="rpi-descricao"
            rows="4"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição detalhada do evento"
            style={{ resize: 'vertical' }}
            required
          />

          <div className="modal-actions">
            {isEditing && (
              <button
                type="button"
                className="confirm-btn"
                style={{ background: '#EF4444', marginRight: 'auto' }}
                onClick={handleDelete}
              >
                <Trash2 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Excluir
              </button>
            )}
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="confirm-btn">
              {isEditing ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdicionarRPIModal;