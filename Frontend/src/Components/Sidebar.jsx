import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Users, DollarSign, Settings, ChevronLeft, ChevronRight, ShieldCheck, ScrollText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const activeFor = (route) => ({
  '/dashboard': route === '/dashboard',
  '/propriedade-intelectual': ['/propriedade-intelectual', '/detalhes', '/cadastro-pi', '/editar-pi'].some(p => route.startsWith(p)),
  '/autores': ['/autores'].some(p => route.startsWith(p)),
  '/pagamentos': route === '/pagamentos',
  '/configuracoes': route === '/configuracoes',
  '/usuarios': route === '/usuarios',
  '/logs': route === '/logs',
});

const navItems = [
  { label: 'Inicio', icon: Home, route: '/dashboard' },
  { label: 'Propriedades Intelectuais', icon: FileText, route: '/propriedade-intelectual' },
  { label: 'Autores', icon: Users, route: '/autores' },
  { label: 'Pagamentos', icon: DollarSign, route: '/pagamentos' },
  { label: 'Configurações', icon: Settings, route: '/configuracoes' },
];

const adminItems = [
  { label: 'Usuários', icon: ShieldCheck, route: '/usuarios' },
  { label: 'Logs', icon: ScrollText, route: '/logs' },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin } = useAuth();
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', collapsed);
        const container = document.querySelector('.container');
        if (container) container.classList.toggle('is-sidebar-collapsed', collapsed);
    }, [collapsed]);

    const items = isAdmin ? [...navItems, ...adminItems] : navItems;
    const isActive = activeFor(location.pathname);

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
                {items.map(item => (
                    <button
                        key={item.route}
                        onClick={() => navigate(item.route)}
                        title={collapsed ? item.label : undefined}
                        className={isActive[item.route] ? 'sidebar-nav-active' : undefined}
                        aria-current={isActive[item.route] ? 'page' : undefined}
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
