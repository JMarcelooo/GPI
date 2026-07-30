import { useState, useEffect } from 'react';
import { FileText, Users, BookOpen, TrendingUp, Download, Clock, CheckCircle, AlertTriangle, XCircle, Award, HelpCircle, DollarSign, Filter } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import '../Tela2.css';
import './Dashboard.css';
import { formatTipo } from '../utils/formatDate';

function Dashboard() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [stats, setStats] = useState({
    ativos: 0, emProcesso: 0, pendentes: 0, total: 0,
    porStatus: [], porTipo: [], porAno: [],
    totalAutores: 0, autoresPorVinculo: [],
    totalPagamentos: 0, pagamentosPagos: 0, pagamentosPendentes: 0
  });
  useEffect(() => {
    Promise.all([
      axios.get(`${process.env.REACT_APP_API_URL}/api/pi`),
      axios.get(`${process.env.REACT_APP_API_URL}/api/autores`),
      axios.get(`${process.env.REACT_APP_API_URL}/api/pagamentos`).catch(() => ({ data: { data: [] } }))
    ]).then(([piRes, autorRes, pagRes]) => {
      const pis = piRes.data.data || [];
      const autores = autorRes.data.data || [];
      const pagamentos = pagRes.data.data || [];

      const total = pis.length;
      const ativos = pis.filter(p => ['deferida', 'registrada', 'carta patente'].includes(p.status)).length;
      const emProcesso = pis.filter(p => p.status === 'em analise').length;
      const pendentes = pis.filter(p => ['indeferida', 'anulada', 'arquivada'].includes(p.status)).length;

      const statusCount = {};
      const tipoCount = {};
      const anoCount = {};
      pis.forEach(p => {
        statusCount[p.status] = (statusCount[p.status] || 0) + 1;
        tipoCount[p.tipo] = (tipoCount[p.tipo] || 0) + 1;
        let ano = p.ano;
        if (!ano && p.data_entrada) {
          const d = new Date(p.data_entrada);
          if (!isNaN(d.getTime())) ano = d.getFullYear();
        }
        if (!ano) {
          const d = new Date(p.createdAt);
          if (!isNaN(d.getTime())) ano = d.getFullYear();
        }
        if (!ano) ano = '-';
        anoCount[ano] = (anoCount[ano] || 0) + 1;
      });

      const vinculoCount = {};
      autores.forEach(a => {
        const v = a.bond || 'Sem vínculo';
        vinculoCount[v] = (vinculoCount[v] || 0) + 1;
      });

      const totalPagamentos = pagamentos.length;
      const pagamentosPagos = pagamentos.filter(p => p.status === 'pago').length;
      const pagamentosPendentes = pagamentos.filter(p => p.status === 'pendente').length;

      setStats({
        ativos, emProcesso, pendentes, total,
        porStatus: Object.entries(statusCount).map(([k, v]) => ({ label: k, value: v })),
        porTipo: Object.entries(tipoCount).map(([k, v]) => ({ label: formatTipo(k), value: v })),
        porAno: Object.entries(anoCount).sort((a, b) => a[0] - b[0]).map(([k, v]) => ({ label: k, value: v })),
        totalAutores: autores.length,
        autoresPorVinculo: Object.entries(vinculoCount).map(([k, v]) => ({ label: k, value: v })),
        totalPagamentos, pagamentosPagos, pagamentosPendentes
      });
    }).catch(err => {
      console.error("Erro ao carregar dados:", err);
    });
  }, []);

  const filterOptions = [
    { value: 'all', label: 'Todos', icon: Filter },
    { value: 'pi', label: 'PI', icon: FileText },
    { value: 'autores', label: 'Autores', icon: Users },
    { value: 'pagamentos', label: 'Pagamentos', icon: DollarSign },
  ];

  const currentFilterLabel = filterOptions.find(f => f.value === activeFilter)?.label || 'Todos';

  const showPI = activeFilter === 'all' || activeFilter === 'pi';
  const showAutores = activeFilter === 'all' || activeFilter === 'autores';
  const showPagamentos = activeFilter === 'all' || activeFilter === 'pagamentos';

  const maxTipo = Math.max(...stats.porTipo.map(t => t.value), 1);
  const maxAno = Math.max(...stats.porAno.map(a => a.value), 1);
  const maxVinculo = Math.max(...stats.autoresPorVinculo.map(v => v.value), 1);

  const statusLabels = {
    'em analise': 'Em Análise',
    'deferida': 'Deferida',
    'registrada': 'Registrada',
    'carta patente': 'Carta Patente',
    'indeferida': 'Indeferida',
    'anulada': 'Anulada',
    'arquivada': 'Arquivada'
  };

  const statusIcons = {
    'em analise': Clock,
    'deferida': CheckCircle,
    'registrada': Award,
    'carta patente': Award,
    'indeferida': XCircle,
    'anulada': AlertTriangle,
    'arquivada': AlertTriangle
  };

  const tipoIcons = {
    'patente de invencao': 'PI',
    'modelo de utilidade': 'MU',
    'marca': 'MA',
    'programa de computador': 'PC'
  };

  const sections = [
    ...(showPI ? [
      { label: 'Ativos', value: stats.ativos, color: 'var(--color-success)', icon: TrendingUp },
      { label: 'Em Processo', value: stats.emProcesso, color: 'var(--color-warning)', icon: BookOpen },
      { label: 'Pendentes', value: stats.pendentes, color: 'var(--color-error)', icon: FileText },
      { label: 'Total de PIs', value: stats.total, color: 'var(--color-primary)', icon: FileText },
    ] : []),
    ...(showAutores ? [
      { label: 'Autores', value: stats.totalAutores, color: 'var(--color-accent)', icon: Users },
    ] : []),
    ...(showPagamentos ? [
      { label: 'Total Pagamentos', value: stats.totalPagamentos, color: 'var(--color-info)', icon: DollarSign },
      { label: 'Pagos', value: stats.pagamentosPagos, color: 'var(--color-success)', icon: CheckCircle },
      { label: 'Pendentes', value: stats.pagamentosPendentes, color: 'var(--color-warning)', icon: Clock },
    ] : []),
  ];

  return (
    <div className="container">
      <Sidebar />

      <div className="main">
        <header className="topbar">
          <h2>Dashboard</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                onBlur={() => setTimeout(() => setShowFilterDropdown(false), 150)}
                className="btn-relatorio"
                style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', gap: 8 }}
              >
                <Filter size={16} /> {currentFilterLabel}
              </button>
              {showFilterDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)',
                  minWidth: 160, zIndex: 100, overflow: 'hidden'
                }}>
                  {filterOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setActiveFilter(opt.value); setShowFilterDropdown(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '10px 16px', border: 'none', background: activeFilter === opt.value ? 'var(--color-primary-bg)' : 'transparent',
                        color: 'var(--color-text)', fontSize: 14, cursor: 'pointer', textAlign: 'left',
                        borderBottom: '1px solid var(--color-border-light)',
                      }}
                    >
                      <opt.icon size={16} color="var(--color-primary)" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-relatorio" onClick={() => window.print()}>
              <Download size={16} /> Gerar Relatório
            </button>
          </div>
        </header>

        <div className="cards dash-cards">
          {sections.map(s => (
            <div key={s.label} className="dash-card" style={{ borderLeftColor: s.color }}>
              <div className="dash-card-icon" style={{ color: s.color }}>
                <s.icon size={22} />
              </div>
              <span className="dash-card-label">{s.label}</span>
              <strong className="dash-card-value" style={{ color: s.color }}>{s.value}</strong>
            </div>
          ))}
        </div>

        <div className="dashboard-grid">
          {showPI && (
            <div className="chart-card">
              <h3 className="chart-title">PIs por Status</h3>
              <div className="donut-container">
                <div className="donut" style={{
                  background: `conic-gradient(${stats.porStatus.map((s, i) => {
                    const colors = ['#93278F', '#FA0183', '#FA7F0C', '#D9E021', '#B849B4', '#10B981', '#94A3B8'];
                    const total = stats.total || 1;
                    const pct = (s.value / total) * 100;
                    const start = stats.porStatus.slice(0, i).reduce((a, s) => a + (s.value / total) * 100, 0);
                    return `${colors[i % colors.length]} ${start}% ${start + pct}%`;
                  }).join(', ')})`
                }}>
                  <div className="donut-center">
                    <strong>{stats.total}</strong>
                    <span>Total</span>
                  </div>
                </div>
                <div className="donut-legend">
                  {stats.porStatus.map((s, i) => {
                    const colors = ['#93278F', '#FA0183', '#FA7F0C', '#D9E021', '#B849B4', '#10B981', '#94A3B8'];
                    const Icon = statusIcons[s.label] || HelpCircle;
                    return (
                      <div key={i} className="legend-item">
                        <Icon size={14} style={{ color: colors[i % colors.length], flexShrink: 0 }} />
                        <span className="legend-label">{statusLabels[s.label] || s.label}</span>
                        <span className="legend-value">{s.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {showPI && (
            <div className="chart-card">
              <h3 className="chart-title">PIs por Tipo</h3>
              <div className="bar-chart-h">
                {stats.porTipo.map((t, i) => {
                  const highlightColors = ['#93278F', '#FA0183', '#FA7F0C', '#D9E021'];
                  return (
                  <div key={i} className="bar-row">
                    <span className="bar-label">{tipoIcons[t.label] || t.label}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(t.value / maxTipo) * 100}%`, background: highlightColors[i % highlightColors.length] }} />
                    </div>
                    <span className="bar-value">{t.value}</span>
                  </div>
                  );
                })}
                {stats.porTipo.length === 0 && <p className="chart-empty">Nenhum dado</p>}
              </div>
            </div>
          )}

          {showPI && (
            <div className="chart-card">
              <h3 className="chart-title">PIs por Ano</h3>
              <div className="line-chart">
                {stats.porAno.length > 0 ? (
                  <svg viewBox="0 0 400 160" className="line-chart-svg">
                    <polyline
                      points={stats.porAno.map((a, i) => {
                        const x = 40 + (i / Math.max(stats.porAno.length - 1, 1)) * 320;
                        const y = 140 - (a.value / maxAno) * 110;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#FA0183"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {stats.porAno.map((a, i) => {
                      const x = 40 + (i / Math.max(stats.porAno.length - 1, 1)) * 320;
                      const y = 140 - (a.value / maxAno) * 110;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="4" fill="var(--color-surface)" stroke="#FA0183" strokeWidth="2" />
                          <text x={x} y={152} textAnchor="middle" fontSize="11" fill="var(--color-text-muted)">{a.label}</text>
                          <text x={x} y={y - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-text)">{a.value}</text>
                        </g>
                      );
                    })}
                    <line x1="40" y1="140" x2="360" y2="140" stroke="var(--color-border)" strokeWidth="1" />
                  </svg>
                ) : <p className="chart-empty">Nenhum dado</p>}
              </div>
            </div>
          )}

          {showAutores && (
            <div className="chart-card">
              <h3 className="chart-title">Autores por Vínculo</h3>
              <div className="bar-chart-h">
                {stats.autoresPorVinculo.map((v, i) => {
                  const highlightColors = ['#FA0183', '#FA7F0C', '#D9E021', '#93278F'];
                  return (
                  <div key={i} className="bar-row">
                    <span className="bar-label">{v.label}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(v.value / maxVinculo) * 100}%`, background: highlightColors[i % highlightColors.length] }} />
                    </div>
                    <span className="bar-value">{v.value}</span>
                  </div>
                  );
                })}
                {stats.autoresPorVinculo.length === 0 && <p className="chart-empty">Nenhum dado</p>}
              </div>
            </div>
          )}

          {showPagamentos && (
            <div className="chart-card">
              <h3 className="chart-title">Pagamentos por Status</h3>
              <div className="bar-chart-h">
                <div className="bar-row">
                  <span className="bar-label">Pagos</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${stats.totalPagamentos > 0 ? (stats.pagamentosPagos / stats.totalPagamentos) * 100 : 0}%`, background: '#10B981' }} />
                  </div>
                  <span className="bar-value">{stats.pagamentosPagos}</span>
                </div>
                <div className="bar-row">
                  <span className="bar-label">Pendentes</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${stats.totalPagamentos > 0 ? (stats.pagamentosPendentes / stats.totalPagamentos) * 100 : 0}%`, background: '#D9E021' }} />
                  </div>
                  <span className="bar-value">{stats.pagamentosPendentes}</span>
                </div>
                {stats.totalPagamentos === 0 && <p className="chart-empty">Nenhum dado de pagamento</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
