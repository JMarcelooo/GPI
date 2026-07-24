import React from 'react';
import '../Telas.css';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  function handleEntrar() {
    // Aqui você pode adicionar validação se quiser antes de navegar
    navigate('/dashboard'); // Rota para onde quer ir após entrar
  }

  return (
    <div className="tela">
      <br/>
      <img src="imagens/Sistema-Logo.png" alt="UERN inova" width="150" height="auto"/>

      <h2>Seja bem-vindo(a)!</h2>
      <input type="email" placeholder="Digite seu e-mail" />
      <input type="password" placeholder="Digite sua senha" />
      <button className="entrar" onClick={handleEntrar}>Entrar</button>
      
      <div>
        <p>Não Tem cadastro?</p>
        <br />
        <Link to="/cadastro" className="botao-link">Cadastre-se</Link>
      </div>

      <br/>
      <br/>
      <br/>
      <img src="imagens/Inova-Rodape.png" alt="UERN inova" width="150" height="auto"/>
    </div>
  );
}

export default Login;

