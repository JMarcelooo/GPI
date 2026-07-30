
import '../Telas.css';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  function handleEntrar() {
    navigate('/dashboard');
  }

  return (
    <div className="tela">
      <div className="login-card">
        <img src="/imagens/Sistema-Logo.png" alt="UERN inova" className="login-logo" />
        <h2>Seja bem-vindo(a)!</h2>
        <input type="email" placeholder="Digite seu e-mail" />
        <input type="password" placeholder="Digite sua senha" />
        <button className="entrar" onClick={handleEntrar}>Entrar</button>
      </div>
      <img src="/imagens/Inova-Rodape.png" alt="UERN inova" className="login-footer" />
    </div>
  );
}

export default Login;
