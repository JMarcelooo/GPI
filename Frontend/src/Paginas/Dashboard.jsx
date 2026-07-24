import React from 'react';
import { User, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../Tela2.css';

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="sidebar">
        <img src="imagens/Sistema-Logo.png" alt="UERN inova" width="150" />
        <nav className="nav">
          <button onClick={() => navigate("/dashboard")}>Inicio</button>
          <button onClick={() => navigate("/propriedade-intelectual")}>Propriedades Intelectuais</button>
          <button onClick={() => navigate("/autores")}>Autores</button>
          <button onClick={() => navigate("/pagamentos")}>Pagamentos</button>
          <button>Configurações</button>
        </nav>
        <img src="imagens/Inova-Rodape.png" alt="Rodapé" width="150" />
      </div>

      <div className="main">
        <header className="topbar">
          <h2>Processos de Registro</h2>
        </header>

        <div className="cards">
          <div className="card ativo">Ativos<br /><strong>-</strong></div>
          <div className="card processo">Em processo<br /><strong>-</strong></div>
          <div className="card pendente">Pendentes<br /><strong>-</strong></div>
          <div className="card total">Total<br /><strong>-</strong></div>
        </div>

        <div className="graficos">
          <div className="grafico">Indicadores<br /><div className="grafico-pizza"></div></div>
          <div className="grafico">Indicadores<br /><div className="grafico-barra"></div></div>
        </div>
      </div>

      <div className="painel-direito">
        <div className="usuario">
          <div><User size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Administrador</div>
          <small>email@email.com</small>
          <button className="sair" onClick={() => navigate("/login")}>Sair</button>
        </div>

        <div className="notificacoes">
          <div className="topo-notificacoes">
            <Bell size={18} />
            <h4>Notificações</h4>
          </div>
          <p style={{ fontSize: 14, color: '#888' }}>Nenhuma notificação</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
