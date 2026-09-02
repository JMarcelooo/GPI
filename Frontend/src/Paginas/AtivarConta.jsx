import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config';

export default function AtivarConta() {
  document.title = 'GPI - Ativar conta';
  const { token } = useParams();
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  async function handle(e) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (!novaSenha || novaSenha.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirm) {
      setError('Senhas não conferem.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/ativar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || 'Falha ao ativar.');
      setMsg(data.message || 'Conta ativada! Redirecionando para login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tela">
      <div className="login-wrap anim-pop">
        <form className="login-card" onSubmit={handle}>
          <img src="/imagens/Sistema-Logo.png" alt="UERN inova" className="login-logo" />
          <h2>Ativar conta</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: '4px 0 12px', textAlign:'center' }}>
            Defina sua senha para ativar o acesso.
          </p>
          <label htmlFor="nova">Nova senha</label>
          <input id="nova" type="password" placeholder="Mínimo 6 caracteres" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} required />
          <label htmlFor="conf">Confirmar senha</label>
          <input id="conf" type="password" placeholder="Repita a senha" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
          {error && <p style={{ color: '#fff', background: 'rgba(239,68,68,0.85)', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', margin: '8px 0 0', width:'100%', boxSizing:'border-box' }}>{error}</p>}
          {msg && <p style={{ color: '#fff', background: 'rgba(16,185,129,0.9)', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', margin: '8px 0 0', width:'100%', boxSizing:'border-box' }}>{msg}</p>}
          <button className="entrar" type="submit" disabled={loading}>{loading?'Ativando...':'Ativar conta'}</button>
          <button type="button" onClick={()=>navigate('/login')} style={{ background:'none', border:'none', color:'var(--color-primary)', fontSize:'0.85rem', cursor:'pointer', marginTop:8 }}>Voltar ao login</button>
        </form>
      </div>
    </div>
  );
}
