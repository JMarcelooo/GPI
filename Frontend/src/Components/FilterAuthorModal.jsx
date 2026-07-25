import React, { useState } from 'react';
import './AuthorModal.css';

export default function FilterAuthorModal({ onClose, onApplyFilters, currentFilters }) {
  const [gender, setGender] = useState(currentFilters.gender || '');
  const [bond, setBond] = useState(currentFilters.bond || '');
  const [campus, setCampus] = useState(currentFilters.campus || '');
  const [department, setDepartment] = useState(currentFilters.department || '');
  const [university, setUniversity] = useState(currentFilters.university || '');

  const handleApply = () => {
    const filters = {};
    if (gender) filters.gender = gender;
    if (bond) filters.bond = bond;
    if (campus) filters.campus = campus;
    if (department) filters.department = department;
    if (university) filters.university = university;
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    onApplyFilters({});
    onClose();
  };

  const hasAnyFilter = gender || bond || campus || department || university;

  return (
    <div className="modal-overlay">
      <div className="modal-content-author">
        <div className="modal-header-author">
          <h2>Filtrar Autores</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-subtitle">Selecione os filtros desejados</div>
        <form onSubmit={(e) => { e.preventDefault(); handleApply(); }}>
          <div className="form-group">
            <label>Gênero</label>
            <div className="radio-group">
              <label>
                <input type="radio" name="filter-gender" value=""
                  checked={gender === ''} onChange={() => setGender('')} /> Todos
              </label>
              <label>
                <input type="radio" name="filter-gender" value="Masculino"
                  checked={gender === 'Masculino'} onChange={(e) => setGender(e.target.value)} /> Masculino
              </label>
              <label>
                <input type="radio" name="filter-gender" value="Feminino"
                  checked={gender === 'Feminino'} onChange={(e) => setGender(e.target.value)} /> Feminino
              </label>
              <label>
                <input type="radio" name="filter-gender" value="Nao informado"
                  checked={gender === 'Nao informado'} onChange={(e) => setGender(e.target.value)} /> Não informado
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Vínculo</label>
            <div className="radio-group">
              <label>
                <input type="radio" name="filter-bond" value=""
                  checked={bond === ''} onChange={() => setBond('')} /> Todos
              </label>
              <label>
                <input type="radio" name="filter-bond" value="Docente"
                  checked={bond === 'Docente'} onChange={(e) => setBond(e.target.value)} /> Docente
              </label>
              <label>
                <input type="radio" name="filter-bond" value="Discente Graduação"
                  checked={bond === 'Discente Graduação'} onChange={(e) => setBond(e.target.value)} /> Discente Graduação
              </label>
              <label>
                <input type="radio" name="filter-bond" value="Técnico"
                  checked={bond === 'Técnico'} onChange={(e) => setBond(e.target.value)} /> Técnico
              </label>
              <label>
                <input type="radio" name="filter-bond" value="Discente Pós-Graduação"
                  checked={bond === 'Discente Pós-Graduação'} onChange={(e) => setBond(e.target.value)} /> Discente Pós-Graduação
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="filter-campus">Campus</label>
            <input type="text" id="filter-campus" value={campus}
              onChange={(e) => setCampus(e.target.value)} placeholder="Filtrar por campus" />
          </div>

          <div className="form-group">
            <label htmlFor="filter-department">Departamento</label>
            <input type="text" id="filter-department" value={department}
              onChange={(e) => setDepartment(e.target.value)} placeholder="Filtrar por departamento" />
          </div>

          <div className="form-group">
            <label htmlFor="filter-university">Universidade</label>
            <input type="text" id="filter-university" value={university}
              onChange={(e) => setUniversity(e.target.value)} placeholder="Filtrar por universidade" />
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
