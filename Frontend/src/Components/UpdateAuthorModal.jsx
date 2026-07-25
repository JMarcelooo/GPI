import React, { useState, useEffect } from 'react';
import './AuthorModal.css';
import Toast from './Toast';

export default function UpdateAuthorModal({ onClose, author, onUpdateSuccess }) {
    // Inicializa o estado com os dados do autor recebido, ou valores vazios se não houver autor
    const [name, setName] = useState(author?.name || '');
    const [email, setEmail] = useState(author?.email || '');
    const [bond, setBond] = useState(author?.bond || '');
    const [department, setDepartment] = useState(author?.department || '');
    const [campus, setCampus] = useState(author?.campus || '');
    const [university, setUniversity] = useState(author?.university || '');
    const [gender, setGender] = useState(author?.gender || 'Nao informado');
    const [phone, setPhone] = useState(author?.phone || '');
    const [phoneError, setPhoneError] = useState('');
    const [toast, setToast] = useState(null);

    // Efeito para atualizar o estado se o prop 'author' mudar
    useEffect(() => {
        if (author) {
            setName(author.name);
            setEmail(author.email);
            setBond(author.bond);
            setDepartment(author.department);
            setCampus(author.campus);
            setUniversity(author.university);
            setGender(author.gender || 'Nao informado');
            setPhone(author.phone ? author.phone.replace(/\D/g, '').slice(0, 11) : '');
            setPhoneError('');
        }
    }, [author]);

    

    const handlePhoneChange = (e) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
      setPhone(digits);
      if (phoneError) setPhoneError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (phone.length !== 11) {
          setPhoneError('Informe um telefone válido');
          return;
        }
        const updatedAuthorData = {
            ...author,
            name,
            email,
            bond,
            department,
            campus,
            university,
            gender,
            phone,
        };
        try {
            if (onUpdateSuccess) {
                await onUpdateSuccess(updatedAuthorData);
            }
            setToast({ message: 'Autor atualizado com sucesso!', type: 'success' });
            setTimeout(onClose, 1000);
        } catch (error) {
            console.error("Erro ao atualizar autor:", error);
            setToast({ message: 'Erro ao atualizar autor. Verifique os dados.', type: 'error' });
        }
    };

    return (
        <>
        <div className="modal-overlay">
            <div className="modal-content-author">
                <div className="modal-header-author">
                    <h2>Editar Autor</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-subtitle">Informações do Autor</div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="edit-name">Nome completo</label>
                        <input
                            type="text"
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome completo"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-email">E-mail</label>
                        <input
                            type="email"
                            id="edit-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@email.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-phone">Telefone</label>
                        <input
                            type="text"
                            id="edit-phone"
                            value={phone}
                            onChange={handlePhoneChange}
                            placeholder="11999999999"
                            required
                            maxLength={11}
                            style={phoneError ? { borderColor: '#dc3545' } : {}}
                        />
                        {phoneError && (
                          <span style={{ color: '#dc3545', fontSize: 'var(--text-xs)', marginTop: 4, display: 'block' }}>
                            {phoneError}
                          </span>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Vínculo</label>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="bond"
                                    value="Docente"
                                    checked={bond === 'Docente'}
                                    onChange={(e) => setBond(e.target.value)}
                                    required
                                /> Docente
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="bond"
                                    value="Discente Graduação"
                                    checked={bond === 'Discente Graduação'}
                                    onChange={(e) => setBond(e.target.value)}
                                /> Discente Graduação
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="bond"
                                    value="Técnico"
                                    checked={bond === 'Técnico'}
                                    onChange={(e) => setBond(e.target.value)}
                                /> Técnico
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="bond"
                                    value="Discente Pós-Graduação"
                                    checked={bond === 'Discente Pós-Graduação'}
                                    onChange={(e) => setBond(e.target.value)}
                                /> Discente Pós-Graduação
                            </label>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-department">Departamento</label>
                        <input
                            type="text"
                            id="edit-department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="Ex.: Departamento de Informática"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-campus">Campus</label>
                        <input
                            type="text"
                            id="edit-campus"
                            value={campus}
                            onChange={(e) => setCampus(e.target.value)}
                            placeholder="Campus"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-university">Universidade</label>
                        <input
                            type="text"
                            id="edit-university"
                            value={university}
                            onChange={(e) => setUniversity(e.target.value)}
                            placeholder="Universidade"
                        />
                    </div>
                    <div className="form-group">
                        <label>Gênero</label>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="gender"
                                    value="Masculino"
                                    checked={gender === 'Masculino'}
                                    onChange={(e) => setGender(e.target.value)}
                                    required
                                /> Masculino
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="gender"
                                    value="Feminino"
                                    checked={gender === 'Feminino'}
                                    onChange={(e) => setGender(e.target.value)}
                                /> Feminino
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="gender"
                                    value="Nao informado"
                                    checked={gender === 'Nao informado'}
                                    onChange={(e) => setGender(e.target.value)}
                                /> Não informado
                            </label>
                        </div>
                    </div>
                    <div className="modal-actions-author">
                        <button type="button" className="cancel-button" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="save-button">
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        </>
    );
}