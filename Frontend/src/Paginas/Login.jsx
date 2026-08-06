import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Telas.css';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [avisoTroca, setAvisoTroca] = useState(false);

  async function handleEntrar(e) {
    e.preventDefault();
    setError(null);
    setAvisoTroca(false);

    if (!email || !senha) {
      setError('Informe e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, senha);
      if (user.deveTrocarSenha) {
        setAvisoTroca(true);
        setError(null);
        navigate('/configuracoes');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Falha ao autenticar. Tente novamente.');
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
      <form className="login-card" onSubmit={handleEntrar}>
        <img src="/imagens/Sistema-Logo.png" alt="UERN inova" className="login-logo" />
        <h2>Seja bem-vindo(a)!</h2>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          placeholder="Digite seu e-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
        <label htmlFor="login-senha">Senha</label>
        <input
          id="login-senha"
          type="password"
          placeholder="Digite sua senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p style={{ color: '#fff', background: 'rgba(239,68,68,0.85)', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', margin: '8px 0 0', width: '100%', boxSizing: 'border-box' }}>{error}</p>}
        {avisoTroca && <p style={{ background: 'rgba(217,224,33,0.9)', color: '#1F2937', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', margin: '8px 0 0', width: '100%', boxSizing: 'border-box' }}>Primeiro acesso: troque sua senha em Configurações.</p>}
        <button className="entrar" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <img src="/imagens/Inova-Rodape.png" alt="UERN inova" className="login-footer" />
    </div>
  );
}

export default Login;
