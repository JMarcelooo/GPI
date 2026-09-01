import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Phone, Building2, GraduationCap, School, Briefcase, Users } from 'lucide-react';
import './AuthorModal.css';
import Toast from './Toast';

export default function UpdateAuthorModal({ onClose, author, onUpdateSuccess }) {
    const [name, setName] = useState(author?.name || '');
    const [email, setEmail] = useState(author?.email || '');
    const [bond, setBond] = useState(author?.bond || '');
    const [department, setDepartment] = useState(author?.department || '');
    const [campus, setCampus] = useState(author?.campus || '');
    const [university, setUniversity] = useState(author?.university || '');
    const [gender, setGender] = useState(author?.gender || 'Nao informado');
    const [phone, setPhone] = useState(author?.phone || '');
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (author) {
            setName(author.name || '');
            setEmail(author.email || '');
            setBond(author.bond || '');
            setDepartment(author.department || '');
            setCampus(author.campus || '');
            setUniversity(author.university || '');
            setGender(author.gender || 'Nao informado');
            setPhone(author.phone ? author.phone.replace(/\D/g, '').slice(0, 11) : '');
        }
    }, [author]);

    useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
      document.addEventListener('keydown', onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = prev;
      };
    }, [onClose]);

    const handlePhoneChange = (e) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
      setPhone(digits);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        const updatedAuthorData = {
            ...author,
            name: name.trim(),
            email: email.trim(),
            bond,
            department: department.trim(),
            campus: campus.trim(),
            university: university.trim(),
            gender,
            phone,
        };
        try {
            if (onUpdateSuccess) {
                await onUpdateSuccess(updatedAuthorData);
            }
            setToast({ message: 'Autor atualizado com sucesso!', type: 'success' });
            setTimeout(onClose, 900);
        } catch (error) {
            console.error("Erro ao atualizar autor:", error);
            setToast({ message: 'Erro ao atualizar autor. Verifique os dados.', type: 'error' });
        } finally {
          setSaving(false);
        }
    };

    const content = (
        <>
        <div className="modal-overlay modal-overlay--author" onClick={onClose} role="dialog" aria-modal="true" aria-label="Editar autor">
            <div className="modal-content-author modal-content-author--new" onClick={e => e.stopPropagation()}>
                <header className="modal-header-author modal-header-author--new">
                    <div className="modal-header-main">
                        <span className="modal-eyebrow"><User size={14} /> Editar autor</span>
                        <h2 title={author?.name}>{author?.name ? `Editar — ${author.name}` : 'Editar Autor'}</h2>
                        <p className="modal-subtitle">Atualize as informações do autor</p>
                    </div>
                    <button className="close-button close-button--icon" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
                </header>

                <form onSubmit={handleSubmit} className="modal-body-author">
                    <div className="form-grid">
                        <div className="form-group form-group--full">
                            <label htmlFor="edit-name"><User size={12} /> Nome completo *</label>
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
                            <label htmlFor="edit-email"><Mail size={12} /> E-mail</label>
                            <input
                                type="email"
                                id="edit-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@uern.br"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="edit-phone"><Phone size={12} /> Telefone</label>
                            <input
                                type="text"
                                id="edit-phone"
                                value={phone}
                                onChange={handlePhoneChange}
                                placeholder="84999999999"
                                inputMode="numeric"
                                maxLength={11}
                            />
                        </div>

                        <div className="form-group form-group--full">
                            <label><Briefcase size={12} /> Vínculo</label>
                            <div className="segmented">
                                {['Docente','Discente Graduação','Técnico','Discente Pós-Graduação','Instituição'].map(v => (
                                  <button
                                    key={v}
                                    type="button"
                                    className={`segmented-btn ${bond===v?'is-active':''}`}
                                    onClick={() => setBond(prev => prev === v ? '' : v)}
                                    aria-pressed={bond===v}
                                  >{v}</button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="edit-department"><GraduationCap size={12} /> Departamento</label>
                            <input
                                type="text"
                                id="edit-department"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="Ex.: Departamento de Informática"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="edit-campus"><School size={12} /> Campus</label>
                            <input
                                type="text"
                                id="edit-campus"
                                value={campus}
                                onChange={(e) => setCampus(e.target.value)}
                                placeholder="Ex.: Campus Central"
                            />
                        </div>

                        <div className="form-group form-group--full">
                            <label htmlFor="edit-university"><Building2 size={12} /> Universidade</label>
                            <input
                                type="text"
                                id="edit-university"
                                value={university}
                                onChange={(e) => setUniversity(e.target.value)}
                                placeholder="Ex.: UERN"
                            />
                        </div>

                        <div className="form-group form-group--full">
                            <label><Users size={12} /> Gênero</label>
                            <div className="segmented">
                                {[
                                  {v:'Masculino', l:'Masculino'},
                                  {v:'Feminino', l:'Feminino'},
                                  {v:'Nao informado', l:'Não informado'},
                                ].map(o => (
                                  <button key={o.v} type="button" className={`segmented-btn ${gender===o.v?'is-active':''}`} onClick={()=>setGender(o.v)} aria-pressed={gender===o.v}>
                                    {o.l}
                                  </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions-author modal-actions-author--new">
                        <button type="button" className="cancel-button" onClick={onClose} disabled={saving}>
                            Cancelar
                        </button>
                        <button type="submit" className="save-button" disabled={saving}>
                            {saving ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        </>
    );

    return createPortal(content, document.body);
}
