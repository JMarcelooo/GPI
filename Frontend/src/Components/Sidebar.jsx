import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
    const navigate = useNavigate();

    return (
        <div className="sidebar">
            <img src="imagens/Sistema-Logo.png" alt="UERN inova" width="150" />
            <nav className="nav">
                <button onClick={() => navigate("/dashboard")}>Inicio</button>
                <button onClick={() => navigate("/propriedade-intelectual")}>Propriedades Intelectuais</button>
                <button onClick={() => navigate("/autores")}>Autores</button>
                <button onClick={() => navigate("/pagamentos")}>Pagamentos</button>
                <button onClick={() => navigate("/configuracoes")}>Configurações</button>
            </nav>
            <img src="imagens/Inova-Rodape.png" alt="Rodapé" width="150" />
        </div>
    );
}
