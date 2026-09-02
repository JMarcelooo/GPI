import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

export default function EsqueciSenha() {
  document.title = 'GPI - Recuperar senha';
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState(1);
  const [identificador, setIdentificador] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  async function solicitar(e) {
    e.preventDefault();
    setError(null); setMsg(null);
    if (!identificador.trim()) { setError('Informe username ou e-mail.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/esqueci`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador })
      });
      const data = await res.json().catch(()=>({}));
      setMsg(data.message || 'Se existir, um código foi enviado para seu e-mail.');
      setEtapa(2);
    } catch (err) {
      setError(err.message || 'Erro ao solicitar código.');
    } finally {
      setLoading(false);
    }
  }

  async function redefinir(e) {
    e.preventDefault();
    setError(null); setMsg(null);
    if (!codigo || !novaSenha) { setError('Informe código e nova senha.'); return; }
    if (novaSenha.length < 6) { setError('Senha deve ter no mínimo 6 caracteres.'); return; }
    if (novaSenha !== confirm) { setError('Senhas não conferem.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/redefinir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador, codigo, novaSenha })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || 'Código inválido.');
      setMsg('Senha redefinida com sucesso! Redirecionando...');
      setTimeout(()=>navigate('/login'), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tela">
      <div className="login-wrap anim-pop">
        <form className="login-card" onSubmit={etapa===1 ? solicitar : redefinir}>
          <img src="/imagens/Sistema-Logo.png" alt="UERN inova" className="login-logo" />
          <h2>{etapa===1 ? 'Recuperar senha' : 'Definir nova senha'}</h2>
          <p style={{ fontSize:'0.85rem', color:'var(--color-text-secondary)', textAlign:'center', margin:'4px 0 8px' }}>
            {etapa===1 ? 'Informe seu username ou e-mail para receber um código.' : `Código enviado para o e-mail de ${identificador}. Válido por 15 minutos.`}
          </p>

          {etapa===1 ? (
            <>
              <label htmlFor="ident">Username ou e-mail</label>
              <input id="ident" type="text" placeholder="username ou e-mail" value={identificador} onChange={e=>setIdentificador(e.target.value)} required />
            </>
          ) : (
            <>
              <label htmlFor="cod">Código de 6 dígitos</label>
              <input id="cod" type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={codigo} onChange={e=>setCodigo(e.target.value.replace(/\D/g,'').slice(0,6))} required />
              <label htmlFor="nova">Nova senha</label>
              <input id="nova" type="password" placeholder="Mínimo 6 caracteres" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} required />
              <label htmlFor="conf">Confirmar senha</label>
              <input id="conf" type="password" placeholder="Repita a senha" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
              <button type="button" onClick={()=>setEtapa(1)} style={{ background:'none', border:'none', color:'var(--color-text-secondary)', fontSize:'0.85rem', cursor:'pointer', marginTop:6, textDecoration:'underline' }}>Voltar / reenviar código</button>
            </>
          )}

          {error && <p style={{ color: '#fff', background: 'rgba(239,68,68,0.85)', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', margin: '8px 0 0', width:'100%', boxSizing:'border-box' }}>{error}</p>}
          {msg && <p style={{ color: '#fff', background: 'rgba(16,185,129,0.9)', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', margin: '8px 0 0', width:'100%', boxSizing:'border-box' }}>{msg}</p>}

          <button className="entrar" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : etapa===1 ? 'Enviar código' : 'Redefinir senha'}
          </button>
          <button type="button" onClick={()=>navigate('/login')} style={{ background:'none', border:'none', color:'var(--color-primary)', fontSize:'0.85rem', cursor:'pointer', marginTop:8 }}>Voltar ao login</button>
        </form>
      </div>
    </div>
  );
}
