import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, Users, DollarSign, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

const navItems = [
  { label: 'Inicio', icon: Home, route: '/dashboard' },
  { label: 'Propriedades Intelectuais', icon: FileText, route: '/propriedade-intelectual' },
  { label: 'Autores', icon: Users, route: '/autores' },
  { label: 'Pagamentos', icon: DollarSign, route: '/pagamentos' },
  { label: 'Configurações', icon: Settings, route: '/configuracoes' },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', collapsed);
    }, [collapsed]);

    return (
        <div className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
            <div className="sidebar-top">
                {collapsed ? (
                    <img src="/imagens/Sistema-Logo-Retratil.png" alt="UERN inova" className="sidebar-logo-retratil" />
                ) : (
                    <img src="/imagens/Sistema-Logo.png" alt="UERN inova" className="sidebar-logo" />
                )}
            </div>
            <nav className="nav">
                {navItems.map(item => (
                    <button
                        key={item.route}
                        onClick={() => navigate(item.route)}
                        title={collapsed ? item.label : undefined}
                    >
                        <item.icon size={20} />
                        {!collapsed && <span>{item.label}</span>}
                    </button>
                ))}
            </nav>
            {!collapsed && (
                <img src="/imagens/Inova-Rodape.png" alt="Rodapé" className="sidebar-footer-img" />
            )}
            <span className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </span>
        </div>
    );
}
