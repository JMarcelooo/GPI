import { useState } from 'react';
import { User, LogOut, Bell, Shield, Info, Moon, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import AlterarSenhaModal from '../Components/AlterarSenhaModal';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import '../Tela2.css';
import './Configuracoes.css';

function Configuracoes() {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);

  async function handleSair() {
    logout();
    navigate('/login');
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
            <KeyRound size={18} /> Segurança
          </h3>
          <div className="config-card config-card-row">
            <div>
              <p className="config-label">Senha</p>
              <p className="config-desc">Altere a senha de acesso ao sistema</p>
            </div>
            <button className="config-btn" onClick={() => setShowAlterarSenha(true)}>
              <KeyRound size={16} /> Alterar senha
            </button>
          </div>
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

      {showAlterarSenha && (
        <AlterarSenhaModal onClose={() => setShowAlterarSenha(false)} />
      )}
    </div>
  );
}

export default Configuracoes;
