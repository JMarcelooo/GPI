import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import '../Telas.css';

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
    if (!identificador.trim()) { setError('Informe nome de usuário ou e-mail.'); return; }
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
      <div className="dec-squares" aria-hidden="true">
        <span className="dec-square" style={{ top: '6%', left: '6%', width: 90, height: 90, background: 'rgba(250, 1, 131, 1)', transform: 'rotate(12deg)' }} />
        <span className="dec-square" style={{ top: '14%', right: '10%', width: 60, height: 60, background: 'rgba(217, 224, 33, 1)', transform: 'rotate(-8deg)' }} />
        <span className="dec-square" style={{ bottom: '20%', left: '12%', width: 70, height: 70, background: 'rgba(0, 159, 223, 1)', transform: 'rotate(20deg)' }} />
        <span className="dec-square" style={{ bottom: '8%', right: '16%', width: 100, height: 100, background: 'rgba(147, 39, 143, 1)', transform: 'rotate(-15deg)' }} />
        <span className="dec-square" style={{ top: '44%', left: '3%', width: 40, height: 40, background: 'rgba(16, 185, 129, 1)', transform: 'rotate(45deg)' }} />
        <span className="dec-square" style={{ top: '56%', right: '4%', width: 50, height: 50, background: 'rgba(250, 127, 12, 1)', transform: 'rotate(10deg)' }} />
        <span className="dec-square" style={{ top: '22%', left: '22%', width: 34, height: 34, background: 'rgba(0, 159, 223, 1)', transform: 'rotate(30deg)' }} />
        <span className="dec-square" style={{ top: '12%', right: '28%', width: 46, height: 46, background: 'rgba(147, 39, 143, 1)', transform: 'rotate(-20deg)' }} />
        <span className="dec-square" style={{ bottom: '16%', left: '26%', width: 52, height: 52, background: 'rgba(250, 1, 131, 1)', transform: 'rotate(8deg)' }} />
        <span className="dec-square" style={{ bottom: '30%', right: '24%', width: 38, height: 38, background: 'rgba(217, 224, 33, 1)', transform: 'rotate(-30deg)' }} />
        <span className="dec-square" style={{ top: '34%', right: '8%', width: 26, height: 26, background: 'rgba(16, 185, 129, 1)', transform: 'rotate(15deg)' }} />
        <span className="dec-square" style={{ top: '70%', left: '8%', width: 30, height: 30, background: 'rgba(250, 127, 12, 1)', transform: 'rotate(-12deg)' }} />
      </div>
      <div className="login-wrap anim-pop">
        <form className="login-card" onSubmit={etapa===1 ? solicitar : redefinir}>
          <img src="/imagens/Sistema-Logo.png" alt="UERN inova" className="login-logo" />
          <h2>{etapa===1 ? 'Recuperar senha' : 'Definir nova senha'}</h2>
          <p style={{ fontSize:'0.85rem', color:'#fff', textAlign:'center', margin:'4px 0 8px', textShadow:'0 1px 2px rgba(0,0,0,0.15)' }}>
            {etapa===1 ? 'Informe seu nome de usuário ou e-mail para receber um código.' : `Código enviado para o e-mail de ${identificador}. Válido por 15 minutos.`}
          </p>

          {etapa===1 ? (
            <>
              <label htmlFor="ident">Nome de usuário ou e-mail</label>
              <input id="ident" type="text" placeholder="Nome de usuário ou e-mail" value={identificador} onChange={e=>setIdentificador(e.target.value)} required />
            </>
          ) : (
            <>
              <label htmlFor="cod">Código de 6 dígitos</label>
              <input id="cod" type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={codigo} onChange={e=>setCodigo(e.target.value.replace(/\D/g,'').slice(0,6))} required />
              <label htmlFor="nova">Nova senha</label>
              <input id="nova" type="password" placeholder="Mínimo 6 caracteres" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} required />
              <label htmlFor="conf">Confirmar senha</label>
              <input id="conf" type="password" placeholder="Repita a senha" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
              <button type="button" onClick={()=>setEtapa(1)} style={{ background:'none', border:'none', color:'#fff', fontSize:'0.85rem', cursor:'pointer', marginTop:6, textDecoration:'underline', textShadow:'0 1px 2px rgba(0,0,0,0.15)' }}>Voltar / reenviar código</button>
            </>
          )}

          {error && <p style={{ color: '#fff', background: 'rgba(239,68,68,0.85)', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', margin: '8px 0 0', width:'100%', boxSizing:'border-box' }}>{error}</p>}
          {msg && <p style={{ color: '#fff', background: 'rgba(16,185,129,0.9)', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', margin: '8px 0 0', width:'100%', boxSizing:'border-box' }}>{msg}</p>}

          <button className="entrar" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : etapa===1 ? 'Enviar código' : 'Redefinir senha'}
          </button>
          <button type="button" onClick={()=>navigate('/login')} style={{ background:'none', border:'none', color:'#009FDF', fontSize:'0.85rem', fontWeight:600, cursor:'pointer', marginTop:8, textDecoration:'underline' }}>Voltar ao login</button>
        </form>
        <img src="/imagens/Inova-Rodape.png" alt="UERN inova" className="login-footer" />
      </div>
    </div>
  );
}
