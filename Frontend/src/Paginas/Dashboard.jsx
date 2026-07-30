import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Tela2.css';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ ativos: 0, emProcesso: 0, pendentes: 0, total: 0 });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/pi`)
      .then(res => {
        const pis = res.data.data || [];
        const total = pis.length;
        const ativos = pis.filter(p =>
          ['deferida', 'registrada', 'carta patente'].includes(p.status)
        ).length;
        const emProcesso = pis.filter(p => p.status === 'em analise').length;
        const pendentes = pis.filter(p =>
          ['indeferida', 'anulada', 'arquivada'].includes(p.status)
        ).length;
        setStats({ ativos, emProcesso, pendentes, total });
      })
      .catch(err => console.error("Erro ao buscar PIs:", err));
  }, []);

  return (
    <div className="container">
      <div className="sidebar">
        <img src="/imagens/Sistema-Logo.png" alt="UERN inova" width="150" />
        <nav className="nav">
          <button onClick={() => navigate("/dashboard")}>Inicio</button>
          <button onClick={() => navigate("/propriedade-intelectual")}>Propriedades Intelectuais</button>
          <button onClick={() => navigate("/autores")}>Autores</button>
          <button onClick={() => navigate("/pagamentos")}>Pagamentos</button>
          <button onClick={() => navigate("/configuracoes")}>Configurações</button>
        </nav>
        <img src="/imagens/Inova-Rodape.png" alt="Rodapé" width="150" />
      </div>

      <div className="main">
        <header className="topbar">
          <h2>Processos de Registro</h2>
        </header>

        <div className="cards">
          <div className="card ativo">Ativos<br /><strong>{stats.ativos}</strong></div>
          <div className="card processo">Em processo<br /><strong>{stats.emProcesso}</strong></div>
          <div className="card pendente">Pendentes<br /><strong>{stats.pendentes}</strong></div>
          <div className="card total">Total<br /><strong>{stats.total}</strong></div>
        </div>

        <div className="graficos">
          <div className="grafico">Indicadores<br /><div className="grafico-pizza"></div></div>
          <div className="grafico">Indicadores<br /><div className="grafico-barra"></div></div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
