import React, { useState } from 'react';
import './AuthorModal.css'; // O CSS compartilhado para os modais

export default function RegisterAuthorModal({ onClose, onRegisterSuccess }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bond, setBond] = useState(''); // Vínculo: Docente, Discente Graduação, Técnico, Discente Pós-Graduação
    const [department, setDepartment] = useState('');
    const [campus, setCampus] = useState('');
    const [university, setUniversity] = useState('');
    const [gender, setGender] = useState('Nao informado');
    const [phone, setPhone] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newAuthorData = { name, email, bond, department, campus, university, gender, phone };
        try {
            if (onRegisterSuccess) {
                await onRegisterSuccess(newAuthorData);
            }
            onClose();
        } catch (error) {
            console.error("Erro ao cadastrar autor:", error);
            alert("Erro ao cadastrar autor. Verifique os dados e tente novamente.");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content-author">
                <div className="modal-header-author">
                    <h2>Cadastrar Novo Autor</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-subtitle">Informações do Autor</div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Nome completo</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome completo"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">E-mail</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@email.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">Telefone</label>
                        <input
                            type="text"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(84) 99999-9999"
                            required
                        />
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
                        <label htmlFor="department">Departamento</label>
                        <input
                            type="text"
                            id="department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="Ex.: Departamento de Informática"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="campus">Campus</label>
                        <input
                            type="text"
                            id="campus"
                            value={campus}
                            onChange={(e) => setCampus(e.target.value)}
                            placeholder="Campus"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="university">Universidade</label>
                        <input
                            type="text"
                            id="university"
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
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}