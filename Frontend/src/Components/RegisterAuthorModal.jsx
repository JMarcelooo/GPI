import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Phone, Building2, GraduationCap, School, Briefcase, Users } from 'lucide-react';
import './AuthorModal.css';
import Toast from './Toast';

export default function RegisterAuthorModal({ onClose, onRegisterSuccess }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bond, setBond] = useState('');
    const [department, setDepartment] = useState('');
    const [campus, setCampus] = useState('');
    const [university, setUniversity] = useState('');
    const [gender, setGender] = useState('Nao informado');
    const [phone, setPhone] = useState('');
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);

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
        if (!name.trim()) {
          setToast({ message: 'Nome é obrigatório.', type: 'error' });
          return;
        }
        setSaving(true);
        const newAuthorData = { name: name.trim(), email: email.trim(), bond: bond || null, department: department.trim(), campus: campus.trim(), university: university.trim(), gender, phone };
        try {
            await onRegisterSuccess(newAuthorData);
            setToast({ message: 'Autor cadastrado com sucesso!', type: 'success' });
            setTimeout(onClose, 800);
        } catch (error) {
            console.error("Erro ao cadastrar autor:", error);
            setToast({ message: 'Erro ao cadastrar autor. Verifique os dados e tente novamente.', type: 'error' });
        } finally {
          setSaving(false);
        }
    };

    const content = (
    <>
        <div className="modal-overlay modal-overlay--author" onClick={onClose} role="dialog" aria-modal="true" aria-label="Cadastrar autor">
            <div className="modal-content-author modal-content-author--new" onClick={e => e.stopPropagation()}>
                <header className="modal-header-author modal-header-author--new">
                    <div className="modal-header-main">
                        <span className="modal-eyebrow"><User size={14} /> Novo autor</span>
                        <h2>Cadastrar Autor</h2>
                        <p className="modal-subtitle">Preencha as informações do novo autor</p>
                    </div>
                    <button className="close-button close-button--icon" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
                </header>

                <form onSubmit={handleSubmit} className="modal-body-author">
                    <div className="form-grid">
                        <div className="form-group form-group--full">
                            <label htmlFor="reg-name"><User size={12} /> Nome completo *</label>
                            <input
                                type="text"
                                id="reg-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nome completo"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-email"><Mail size={12} /> E-mail</label>
                            <input
                                type="email"
                                id="reg-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@uern.br"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-phone"><Phone size={12} /> Telefone</label>
                            <input
                                type="text"
                                id="reg-phone"
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
                            <label htmlFor="reg-department"><GraduationCap size={12} /> Departamento</label>
                            <input
                                type="text"
                                id="reg-department"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="Ex.: Departamento de Informática"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-campus"><School size={12} /> Campus</label>
                            <input
                                type="text"
                                id="reg-campus"
                                value={campus}
                                onChange={(e) => setCampus(e.target.value)}
                                placeholder="Ex.: Campus Central"
                            />
                        </div>

                        <div className="form-group form-group--full">
                            <label htmlFor="reg-university"><Building2 size={12} /> Universidade</label>
                            <input
                                type="text"
                                id="reg-university"
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
                            {saving ? 'Salvando...' : 'Cadastrar'}
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
