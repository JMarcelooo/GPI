import API_URL from '../config';
import { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import './AuthorModal.css';

const API = API_URL;

function CampoSenha({ label, id, value, onChange, autoComplete }) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <>
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className="password-field">
        <input
          id={id}
          className="form-input"
          type={mostrar ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setMostrar(!mostrar)}
          title={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
          aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </>
  );
}

export default function AlterarSenhaModal({ onClose, onSuccess, forcada }) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (!forcada && !senhaAtual) {
      setErro('Informe a senha atual.');
      return;
    }
    if (!novaSenha) {
      setErro('Informe a nova senha.');
      return;
    }
    if (novaSenha !== confirmar) {
      setErro('A confirmação não confere com a nova senha.');
      return;
    }
    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSaving(true);
    try {
      const body = { novaSenha };
      if (!forcada) body.senhaAtual = senhaAtual;
      await axios.post(`${API}/api/auth/alterar-senha`, body);
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      const data = error.response?.data;
      if (data?.error) setErro(data.error);
      else setErro('Erro de conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content-author">
        <div className="modal-header-author">
          <h2>Alterar senha</h2>
          {!forcada && <button className="close-button" onClick={onClose}>&times;</button>}
        </div>
        {forcada && (
          <div className="modal-subtitle">
            Por segurança, você deve definir uma nova senha antes de continuar.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {!forcada && (
            <CampoSenha
              label="Senha atual"
              id="ap-senha-atual"
              value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              autoComplete="current-password"
            />
          )}
          <CampoSenha
            label="Nova senha"
            id="ap-nova-senha"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            autoComplete="new-password"
          />
          <CampoSenha
            label="Confirmar nova senha"
            id="ap-confirmar"
            value={confirmar}
            onChange={e => setConfirmar(e.target.value)}
            autoComplete="new-password"
          />
          {erro && <p className="form-erro">{erro}</p>}
          <div className="modal-actions-author">
            {!forcada && <button type="button" className="cancel-button" onClick={onClose}>Cancelar</button>}
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
