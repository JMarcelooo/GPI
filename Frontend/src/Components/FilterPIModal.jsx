import React, { useState } from 'react';
import './AuthorModal.css';

export default function FilterPIModal({ onClose, onApplyFilters, currentFilters }) {
  const [status, setStatus] = useState(currentFilters.status || '');
  const [tipo, setTipo] = useState(currentFilters.tipo || '');

  const handleApply = () => {
    const filters = {};
    if (status) filters.status = status;
    if (tipo) filters.tipo = tipo;
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    onApplyFilters({});
    onClose();
  };

  const hasAnyFilter = status || tipo;

  return (
    <div className="modal-overlay">
      <div className="modal-content-author">
        <div className="modal-header-author">
          <h2>Filtrar PIs</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-subtitle">Selecione os filtros desejados</div>
        <form onSubmit={(e) => { e.preventDefault(); handleApply(); }}>
          <div className="form-group">
            <label>Tipo</label>
            <div className="radio-group">
              <label>
                <input type="radio" name="filter-tipo" value=""
                  checked={tipo === ''} onChange={() => setTipo('')} /> Todos
              </label>
              <label>
                <input type="radio" name="filter-tipo" value="patente de invencao"
                  checked={tipo === 'patente de invencao'} onChange={(e) => setTipo(e.target.value)} /> Patente de Invenção
              </label>
              <label>
                <input type="radio" name="filter-tipo" value="modelo de utilidade"
                  checked={tipo === 'modelo de utilidade'} onChange={(e) => setTipo(e.target.value)} /> Modelo de Utilidade
              </label>
              <label>
                <input type="radio" name="filter-tipo" value="marca"
                  checked={tipo === 'marca'} onChange={(e) => setTipo(e.target.value)} /> Marca
              </label>
              <label>
                <input type="radio" name="filter-tipo" value="programa de computador"
                  checked={tipo === 'programa de computador'} onChange={(e) => setTipo(e.target.value)} /> Programa de Computador
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <div className="radio-group">
              <label>
                <input type="radio" name="filter-status" value=""
                  checked={status === ''} onChange={() => setStatus('')} /> Todos
              </label>
              <label>
                <input type="radio" name="filter-status" value="indeferida"
                  checked={status === 'indeferida'} onChange={(e) => setStatus(e.target.value)} /> Indeferida
              </label>
              <label>
                <input type="radio" name="filter-status" value="anulada"
                  checked={status === 'anulada'} onChange={(e) => setStatus(e.target.value)} /> Anulada
              </label>
              <label>
                <input type="radio" name="filter-status" value="arquivada"
                  checked={status === 'arquivada'} onChange={(e) => setStatus(e.target.value)} /> Arquivada
              </label>
              <label>
                <input type="radio" name="filter-status" value="em analise"
                  checked={status === 'em analise'} onChange={(e) => setStatus(e.target.value)} /> Em Análise
              </label>
              <label>
                <input type="radio" name="filter-status" value="deferida"
                  checked={status === 'deferida'} onChange={(e) => setStatus(e.target.value)} /> Deferida
              </label>
              <label>
                <input type="radio" name="filter-status" value="registrada"
                  checked={status === 'registrada'} onChange={(e) => setStatus(e.target.value)} /> Registrada
              </label>
              <label>
                <input type="radio" name="filter-status" value="carta patente"
                  checked={status === 'carta patente'} onChange={(e) => setStatus(e.target.value)} /> Carta Patente
              </label>
            </div>
          </div>

          <div className="modal-actions-author">
            {hasAnyFilter && (
              <button type="button" className="cancel-button" onClick={handleClear}
                style={{ marginRight: 'auto' }}>
                Limpar Filtros
              </button>
            )}
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="save-button">
              Aplicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
