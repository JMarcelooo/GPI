import React, { useState } from 'react';
import './AuthorModal.css';

const TIPOS = [
  { value: 'patente de invencao', label: 'Patente de Invenção' },
  { value: 'modelo de utilidade', label: 'Modelo de Utilidade' },
  { value: 'marca', label: 'Marca' },
  { value: 'programa de computador', label: 'Programa de Computador' }
];

const STATUS = [
  { value: 'em analise', label: 'Em Análise' },
  { value: 'deferida', label: 'Deferida' },
  { value: 'registrada', label: 'Registrada' },
  { value: 'carta patente', label: 'Carta Patente' },
  { value: 'indeferida', label: 'Indeferida' },
  { value: 'anulada', label: 'Anulada' },
  { value: 'arquivada', label: 'Arquivada' }
];

const ANO_ATUAL = new Date().getFullYear();
const ANOS = Array.from({ length: ANO_ATUAL - 1999 }, (_, i) => ANO_ATUAL - i);

export default function FilterPIModal({ onClose, onApplyFilters, currentFilters }) {
  const [status, setStatus] = useState(currentFilters.status || '');
  const [tipo, setTipo] = useState(currentFilters.tipo || '');
  const [ano, setAno] = useState(currentFilters.ano || '');

  const handleApply = () => {
    const filters = {};
    if (status) filters.status = status;
    if (tipo) filters.tipo = tipo;
    if (ano) filters.ano = ano;
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    onApplyFilters({});
    onClose();
  };

  const hasAnyFilter = status || tipo || ano;

  return (
    <div className="modal-overlay">
      <div className="modal-content-author">
        <div className="modal-header-author">
          <h2>Filtrar PIs</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-subtitle">Combine os filtros para refinar a busca</div>
        <form onSubmit={(e) => { e.preventDefault(); handleApply(); }}>
          <div className="form-group">
            <label htmlFor="filtro-tipo">Tipo</label>
            <select id="filtro-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="filtro-status">Status</label>
            <select id="filtro-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="filtro-ano">Ano de entrada</label>
            <select id="filtro-ano" value={ano} onChange={(e) => setAno(e.target.value)}>
              <option value="">Todos os anos</option>
              {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
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
