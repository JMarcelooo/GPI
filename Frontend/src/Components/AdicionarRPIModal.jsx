import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa o hook

import '../Paginas/Detalhe1.css'; // <--- ESTA LINHA É A CORREÇÃO

const AdicionarRPIModal = ({ isOpen, onClose, onAddRPI }) => {
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const novaRPI = {
      date: data,
      version: 'Nova Versão', // Você pode precisar implementar uma lógica mais robusta para a versão
      description: descricao,
    };
    onAddRPI(novaRPI);
    setData('');
    setDescricao('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Adicionar Nova Informação de RPI</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="rpi-data">Data</label>
            <input
              type="date"
              id="rpi-data"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="Selecione uma data"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="rpi-descricao">Descrição</label>
            <textarea
              id="rpi-descricao"
              rows="4"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição detalhada"
              required
            ></textarea>
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="add-button">
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdicionarRPIModal;