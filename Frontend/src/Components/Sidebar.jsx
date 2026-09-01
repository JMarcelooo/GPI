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
];

const adminItems = [
  { label: 'Usuários', icon: ShieldCheck, route: '/usuarios' },
  { label: 'Logs', icon: ScrollText, route: '/logs' },
];

const bottomItems = [
  { label: 'Configurações', icon: Settings, route: '/configuracoes' },
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

    const topItems = isAdmin ? [...navItems, ...adminItems] : navItems;
    const isActive = activeFor(location.pathname);

    const renderItem = (item) => {
        const active = !!isActive[item.route];
        return (
            <button
                key={item.route}
                onClick={() => navigate(item.route)}
                title={collapsed ? item.label : undefined}
                className={active ? 'sidebar-nav-active' : undefined}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
            >
                <span className="sidebar-icon">
                    <item.icon size={18} />
                </span>
                {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </button>
        );
    };

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
            <div className="sidebar-top">
                {collapsed ? (
                    <img src="/imagens/Sistema-Logo-Retratil.png" alt="UERN inova" className="sidebar-logo-retratil" />
                ) : (
                    <img src="/imagens/Sistema-Logo.png" alt="UERN inova" className="sidebar-logo" />
                )}
            </div>

            <div className="sidebar-navs">
                <nav className="sidebar-nav sidebar-nav--main" aria-label="Principal">
                    {topItems.slice(0, navItems.length).map(renderItem)}
                    {isAdmin && !collapsed && <span className="sidebar-section">Administração</span>}
                    {isAdmin && topItems.slice(navItems.length).map(renderItem)}
                </nav>

                <div className="sidebar-spacer" aria-hidden="true" />

                <nav className="sidebar-nav sidebar-nav--bottom" aria-label="Sistema">
                    <div className="sidebar-divider" />
                    {bottomItems.map(renderItem)}
                </nav>
            </div>

            {!collapsed && (
                <img src="/imagens/Inova-Rodape.png" alt="Rodapé" className="sidebar-footer-img" />
            )}
            <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
                title={collapsed ? 'Expandir' : 'Recolher'}
            >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
        </aside>
    );
}
