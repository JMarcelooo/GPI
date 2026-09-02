import { useState, useEffect } from 'react';
import API_URL from '../config';
import { User, LogOut, Shield, Info, Moon, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import AlterarSenhaModal from '../Components/AlterarSenhaModal';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import '../Tela2.css';
import './Configuracoes.css';

function Configuracoes() {
  document.title = 'GPI - Configurações';
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);
  const [editUsername, setEditUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [usernameMsg, setUsernameMsg] = useState(null);
  const [usernameError, setUsernameError] = useState(null);
  const [editNome, setEditNome] = useState(false);
  const [newNome, setNewNome] = useState(user?.nome || '');
  const [nomeMsg, setNomeMsg] = useState(null);
  const [nomeError, setNomeError] = useState(null);

  async function handleSair() {
    logout();
    navigate('/login');
  }

  async function handleSalvarUsername(e) {
    e.preventDefault();
    setUsernameMsg(null); setUsernameError(null);
    const v = String(newUsername || '').toLowerCase().trim();
    if (!/^[a-z0-9_.]{3,30}$/.test(v)) {
      setUsernameError('Username deve ter 3-30 caracteres (a-z, 0-9, ponto, sublinhado).');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: v })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar username.');
      updateUser({ username: data.user.username });
      setUsernameMsg('Username atualizado com sucesso. Use-o no próximo login.');
      setEditUsername(false);
    } catch (err) {
      setUsernameError(err.message);
    }
  }

  useEffect(() => {
    if (user?.username) setNewUsername(user.username);
    if (user?.nome) setNewNome(user.nome);
  }, [user?.username, user?.nome]);

  async function handleSalvarNome(e) {
    e.preventDefault();
    setNomeMsg(null); setNomeError(null);
    const v = String(newNome || '').trim();
    if (!v || v.length < 2) {
      setNomeError('Nome deve ter ao menos 2 caracteres.');
      return;
    }
    if (v.length > 150) {
      setNomeError('Nome muito longo (máximo 150 caracteres).');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nome: v })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar nome.');
      updateUser({ nome: data.user.nome });
      setNomeMsg('Nome atualizado com sucesso.');
      setEditNome(false);
    } catch (err) {
      setNomeError(err.message);
    }
  }

  return (
    <div className="container">
      <Sidebar />
      <div className="main anim-fade">
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
              {editNome ? (
                <form onSubmit={handleSalvarNome} style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:8 }}>
                  <input value={newNome} onChange={e=>setNewNome(e.target.value)} placeholder="novo nome de exibição" style={{ padding:'6px 10px', border:'1px solid var(--color-border)', borderRadius:6, fontSize:'0.9rem', flex:1, minWidth:160 }} />
                  <button type="submit" className="config-btn" style={{ padding:'6px 12px' }}>Salvar</button>
                  <button type="button" className="config-btn" style={{ background:'var(--color-border)', color:'var(--color-text-secondary)' }} onClick={()=>{ setEditNome(false); setNewNome(user?.nome||''); setNomeError(null); setNomeMsg(null); }}>Cancelar</button>
                </form>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <p className="config-name" style={{ margin:0 }}>{user?.nome || 'Usuário'}</p>
                  <button className="config-btn" style={{ padding:'4px 8px', fontSize:'0.75rem' }} onClick={()=>{ setNewNome(user?.nome||''); setEditNome(true); }}>Alterar nome</button>
                </div>
              )}
              {nomeMsg && <p style={{ color:'var(--color-success)', fontSize:'0.85rem', margin:'4px 0 0' }}>{nomeMsg}</p>}
              {nomeError && <p style={{ color:'var(--color-error)', fontSize:'0.85rem', margin:'4px 0 0' }}>{nomeError}</p>}
              <p className="config-email" style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                {user?.username || '—'} <span style={{ opacity:0.6 }}>·</span> {user?.email}
              </p>
              <p className="config-desc">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
              {editUsername ? (
                <form onSubmit={handleSalvarUsername} style={{ display:'flex', gap:8, marginTop:8, alignItems:'center', flexWrap:'wrap' }}>
                  <input value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="novo username" style={{ padding:'6px 10px', border:'1px solid var(--color-border)', borderRadius:6, fontSize:'0.9rem' }} />
                  <button type="submit" className="config-btn" style={{ padding:'6px 12px' }}>Salvar</button>
                  <button type="button" className="config-btn" style={{ background:'var(--color-border)', color:'var(--color-text-secondary)' }} onClick={()=>{ setEditUsername(false); setNewUsername(user?.username||''); setUsernameError(null); setUsernameMsg(null); }}>Cancelar</button>
                </form>
              ) : (
                <button className="config-btn" style={{ marginTop:8, padding:'6px 12px', fontSize:'0.85rem' }} onClick={()=>{ setNewUsername(user?.username||''); setEditUsername(true); }}>
                  Alterar username
                </button>
              )}
              {usernameMsg && <p style={{ color:'var(--color-success)', fontSize:'0.85rem', margin:'6px 0 0' }}>{usernameMsg}</p>}
              {usernameError && <p style={{ color:'var(--color-error)', fontSize:'0.85rem', margin:'6px 0 0' }}>{usernameError}</p>}
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
              <p className="config-desc">Altere sua senha de acesso</p>
            </div>
            <button className="config-btn" onClick={() => setShowAlterarSenha(true)}>
              <KeyRound size={16} /> Alterar senha
            </button>
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
