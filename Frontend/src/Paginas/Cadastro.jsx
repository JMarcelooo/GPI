import React from 'react';
import '../Telas.css';
import { useNavigate } from 'react-router-dom'; // Importa o hook

function Cadastro() {
  const navigate = useNavigate(); // Instancia o hook

  return (
    <div className="tela">
    <img src="imagens/Sistema-Logo.png" alt="UERN inova" width="150" height="auto"/>
      <h2>Cadastro de Usuário</h2>

      <input type="text" placeholder="Digite seu nome completo" />
      <input type="email" placeholder="Digite seu e-mail" />
      <input type="text" placeholder="Digite seu SIAPE" />
      <input type="password" placeholder="Cadastre sua senha" />

      {/* Botões FUNCIONAIS */}
      <div className="botoes">
        <button className="voltar" onClick={() => navigate('/')}>Voltar</button>
        <button
          className="cadastrar"
          onClick={() => alert('Usuário cadastrado com sucesso!')}
        >
          Cadastrar
        </button>
      </div>
<img src="imagens/Inova-Rodape.png" alt="UERN inova" width="150" height="auto"/>


    </div>
  );
}

export default Cadastro;
