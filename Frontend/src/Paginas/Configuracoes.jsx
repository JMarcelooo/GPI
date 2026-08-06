import { useState } from 'react';
import { User, LogOut, Bell, Shield, Info, Moon, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import '../Tela2.css';
import './Configuracoes.css';

const API = process.env.REACT_APP_API_URL;

function Configuracoes() {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [msg, setMsg] = useState(null);
  const [erro, setErro] = useState(null);
  const [loadingSenha, setLoadingSenha] = useState(false);

  async function handleSair() {
    logout();
    navigate('/login');
  }

  async function handleTrocarSenha(e) {
    e.preventDefault();
    setMsg(null);
    setErro(null);

    if (!senhaAtual || !novaSenha) {
      setErro('Preencha a senha atual e a nova senha.');
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

    setLoadingSenha(true);
    try {
      await fetch(`${API}/api/auth/alterar-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('gpi_token')}` },
        body: JSON.stringify({ senhaAtual, novaSenha })
      }).then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Falha ao alterar a senha.');
        return data;
      });
      setMsg('Senha alterada com sucesso.');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmar('');
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoadingSenha(false);
    }
  }

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <h2>Configurações</h2>
        </header>

        <div className="config-section">
          <h3 className="config-section-title">
            <User size={18} /> Perfil
          </h3>
          <div className="config-card">
            <div className="config-avatar">
              <User size={32} />
            </div>
            <div className="config-info">
              <p className="config-name">{user?.nome || 'Usuário'}</p>
              <p className="config-email">{user?.email}</p>
              <p className="config-desc">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
            </div>
            <button className="config-btn config-btn-danger" onClick={handleSair}>
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>

        <div className="config-section">
          <h3 className="config-section-title">
            <KeyRound size={18} /> Alterar senha
          </h3>
          <form className="config-card" onSubmit={handleTrocarSenha}>
            <label className="config-label" htmlFor="senha-atual">Senha atual</label>
            <input
              id="senha-atual"
              className="config-input"
              type="password"
              value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              autoComplete="current-password"
            />
            <label className="config-label" htmlFor="nova-senha">Nova senha</label>
            <input
              id="nova-senha"
              className="config-input"
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              autoComplete="new-password"
            />
            <label className="config-label" htmlFor="confirmar-senha">Confirmar nova senha</label>
            <input
              id="confirmar-senha"
              className="config-input"
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              autoComplete="new-password"
            />
            {erro && <p className="config-msg config-msg-erro">{erro}</p>}
            {msg && <p className="config-msg config-msg-ok">{msg}</p>}
            <button className="config-btn" type="submit" disabled={loadingSenha}>
              {loadingSenha ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        </div>

        <div className="config-section">
          <h3 className="config-section-title">
            <Bell size={18} /> Notificações
          </h3>
          <div className="config-card config-card-row">
            <div>
              <p className="config-label">Notificações por e-mail</p>
              <p className="config-desc">Receber alertas sobre prazos e atualizações</p>
            </div>
            <label className="config-toggle">
              <input type="checkbox" defaultChecked />
              <span className="config-toggle-slider"></span>
            </label>
          </div>
          <div className="config-card config-card-row">
            <div>
              <p className="config-label">Notificações de status</p>
              <p className="config-desc">Alertar quando uma PI mudar de status</p>
            </div>
            <label className="config-toggle">
              <input type="checkbox" defaultChecked />
              <span className="config-toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="config-section">
          <h3 className="config-section-title">
            <Moon size={18} /> Aparência
          </h3>
          <div className="config-card config-card-row">
            <div>
              <p className="config-label">Modo escuro</p>
              <p className="config-desc">Alternar entre tema claro e escuro</p>
            </div>
            <label className="config-toggle">
              <input type="checkbox" checked={dark} onChange={toggleTheme} />
              <span className="config-toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="config-section">
          <h3 className="config-section-title">
            <Shield size={18} /> Sistema
          </h3>
          <div className="config-card config-card-row">
            <div>
              <p className="config-label">Versão do sistema</p>
              <p className="config-desc">INOVA UERN — v1.0.0</p>
            </div>
          </div>
        </div>

        <div className="config-section">
          <h3 className="config-section-title">
            <Info size={18} /> Sobre
          </h3>
          <div className="config-card">
            <p className="config-desc">
              Sistema de gerenciamento de Propriedade Intelectual da UERN.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Configuracoes;
