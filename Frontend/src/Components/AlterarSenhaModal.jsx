import API_URL from '../config';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
  const { user } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState(null);
  const [info, setInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);

  async function handleEnviarCodigo() {
    setErro(null); setInfo(null);
    try {
      setEnviandoCodigo(true);
      await axios.post(`${API}/api/auth/esqueci`, { email: user?.email });
      setInfo(`Código enviado para ${user?.email} (válido por 15 minutos). Verifique sua caixa de entrada.`);
    } catch (e) {
      setErro(e.response?.data?.error || 'Erro ao enviar código. Tente novamente.');
    } finally {
      setEnviandoCodigo(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null); setInfo(null);

    if (!forcada && !senhaAtual) {
      setErro('Informe a senha atual.');
      return;
    }
    if (!forcada && !codigo) {
      setErro('Informe o código enviado por e-mail.');
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
      if (!forcada) {
        // Verifica código antes de trocar
        await axios.post(`${API}/api/auth/verificar-codigo`, { email: user?.email, codigo });
      }
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

  // Envia código automaticamente ao abrir (apenas modo normal)
  useEffect(() => {
    if (!forcada && user?.email) {
      handleEnviarCodigo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content-author">
        <div className="modal-header-author">
          <h2>Alterar senha</h2>
          {!forcada && <button className="close-button" onClick={onClose}>&times;</button>}
        </div>
        {forcada ? (
          <div className="modal-subtitle">
            Por segurança, você deve definir uma nova senha antes de continuar.
          </div>
        ) : (
          <div style={{ background:'var(--color-primary-bg)', border:'1px solid var(--color-primary-100)', borderRadius:8, padding:'10px 12px', marginBottom:12, fontSize:'0.85rem', color:'var(--color-text)', lineHeight:1.5 }}>
            <p style={{ margin:'0 0 6px', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}><Mail size={14} /> Verificação por e-mail</p>
            <p style={{ margin:0, color:'var(--color-text-secondary)' }}>
              Enviamos um código de 6 dígitos para <strong>{user?.email}</strong>. Use-o abaixo para confirmar a troca. O código é válido por 15 minutos.
            </p>
            <button type="button" onClick={handleEnviarCodigo} disabled={enviandoCodigo} style={{ marginTop:8, background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:6, padding:'6px 12px', fontSize:'0.8rem', cursor:'pointer', fontWeight:600 }}>
              {enviandoCodigo ? 'Enviando...' : 'Reenviar código'}
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {!forcada && (
            <>
              <label className="form-label" htmlFor="ap-codigo">Código enviado por e-mail *</label>
              <input
                id="ap-codigo"
                className="form-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={codigo}
                onChange={e => setCodigo(e.target.value.replace(/\D/g,'').slice(0,6))}
                style={{ letterSpacing:'4px', textAlign:'center', fontWeight:700 }}
                required
              />
              <CampoSenha
                label="Senha atual *"
                id="ap-senha-atual"
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
                autoComplete="current-password"
              />
            </>
          )}
          <CampoSenha
            label="Nova senha *"
            id="ap-nova-senha"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            autoComplete="new-password"
          />
          <CampoSenha
            label="Confirmar nova senha *"
            id="ap-confirmar"
            value={confirmar}
            onChange={e => setConfirmar(e.target.value)}
            autoComplete="new-password"
          />
          {info && <p style={{ color:'var(--color-success)', background:'var(--color-success-bg)', padding:'8px 12px', borderRadius:6, fontSize:'0.85rem', margin:'8px 0 0' }}>{info}</p>}
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
