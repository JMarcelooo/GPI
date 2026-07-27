import React, { useState } from 'react';

import '../Paginas/Modal.css';

const AdicionarRPIModal = ({ isOpen, onClose, onAddRPI }) => {
  const [data, setData] = useState('');
  const [codigoEvento, setCodigoEvento] = useState('');
  const [descricao, setDescricao] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddRPI({
      data,
      codigo_evento: Number(codigoEvento),
      descricao_do_evento: descricao
    });
    setData('');
    setCodigoEvento('');
    setDescricao('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Adicionar RPI</h2>
        <form onSubmit={handleSubmit}>
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
            placeholder="Ex.: 2.1"
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
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="confirm-btn">
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdicionarRPIModal;