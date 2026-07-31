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
    totalPagamentos: 0, pagamentosPagos: 0, pagamentosAguardando: 0, pagamentosAndamento: 0
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
      const pagamentosAguardando = pagamentos.filter(p => (p.status || 'aguardando prazo') === 'aguardando prazo').length;
      const pagamentosAndamento = pagamentos.filter(p => p.status === 'em andamento').length;

      setStats({
        ativos, emProcesso, pendentes, total,
        porStatus: Object.entries(statusCount).map(([k, v]) => ({ label: k, value: v })),
        porTipo: Object.entries(tipoCount).map(([k, v]) => ({ label: formatTipo(k), value: v })),
        porAno: Object.entries(anoCount).sort((a, b) => a[0] - b[0]).map(([k, v]) => ({ label: k, value: v })),
        totalAutores: autores.length,
        autoresPorVinculo: Object.entries(vinculoCount).map(([k, v]) => ({ label: k, value: v })),
        totalPagamentos, pagamentosPagos, pagamentosAguardando, pagamentosAndamento
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

  const piCards = showPI ? [
    { label: 'Total de PIs', value: stats.total, color: 'var(--color-primary)', icon: FileText, bg: 'var(--color-primary-bg)' },
    { label: 'Ativas', value: stats.ativos, color: 'var(--color-success)', icon: TrendingUp, bg: 'var(--color-success-bg)' },
    { label: 'Em Processo', value: stats.emProcesso, color: 'var(--color-warning)', icon: BookOpen, bg: 'var(--color-warning-bg)' },
    { label: 'Pendentes', value: stats.pendentes, color: 'var(--color-error)', icon: AlertTriangle, bg: 'var(--color-error-bg)' },
  ] : [];

  const payCards = showPagamentos ? [
    { label: 'Total', value: stats.totalPagamentos, color: 'var(--color-info)', icon: DollarSign, bg: 'var(--color-info-bg)' },
    { label: 'Aguardando prazo', value: stats.pagamentosAguardando, color: 'var(--color-warning)', icon: Clock, bg: 'var(--color-warning-bg)' },
    { label: 'Em andamento', value: stats.pagamentosAndamento, color: 'var(--color-primary)', icon: TrendingUp, bg: 'var(--color-primary-bg)' },
    { label: 'Pagos', value: stats.pagamentosPagos, color: 'var(--color-success)', icon: CheckCircle, bg: 'var(--color-success-bg)' },
  ] : [];

  const autorCards = showAutores ? [
    { label: 'Autores', value: stats.totalAutores, color: 'var(--color-accent)', icon: Users, bg: 'var(--color-accent-bg)' },
  ] : [];

  return (
    <div className="container">
      <Sidebar />

      <div className="main">
        <header className="dash-header">
          <div>
            <h1 className="dash-title">Dashboard</h1>
            <p className="dash-subtitle">
              Visão geral da gestão de propriedade intelectual · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
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

        {(piCards.length > 0 || autorCards.length > 0) && (
          <section className="dash-section">
            <div className="dash-section-head">
              <h3 className="dash-section-title">Propriedade Intelectual</h3>
              <p className="dash-section-sub">Portfólio de PIs e autores cadastrados</p>
            </div>
            <div className="kpi-grid">
              {[...piCards, ...autorCards].map(s => (
                <div key={s.label} className="pay-kpi-card">
                  <div className="pay-kpi-icon" style={{ background: s.bg, color: s.color }}>
                    <s.icon size={20} />
                  </div>
                  <div className="pay-kpi-info">
                    <strong className="pay-kpi-value" style={{ color: s.color }}>{s.value}</strong>
                    <span className="pay-kpi-label">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {payCards.length > 0 && (
          <section className="dash-section">
            <div className="dash-section-head">
              <h3 className="dash-section-title">Pagamentos</h3>
              <p className="dash-section-sub">Situação dos pagamentos por status</p>
            </div>
            <div className="pay-panel">
              <div className="pay-kpis">
                {payCards.map(s => (
                  <div key={s.label} className="pay-kpi-card">
                    <div className="pay-kpi-icon" style={{ background: s.bg, color: s.color }}>
                      <s.icon size={20} />
                    </div>
                    <div className="pay-kpi-info">
                      <strong className="pay-kpi-value" style={{ color: s.color }}>{s.value}</strong>
                      <span className="pay-kpi-label">{s.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pay-side">
                <div className="chart-card">
                  <h3 className="chart-title">
                    <DollarSign size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-primary)' }} />
                    Pagamentos por Status
                  </h3>
                  {stats.totalPagamentos > 0 ? (
                    <div className="donut-container">
                      <div className="donut" style={{
                        background: `conic-gradient(${(() => {
                          const rows = [
                            { label: 'Aguardando prazo', value: stats.pagamentosAguardando, color: '#D9E021' },
                            { label: 'Em andamento', value: stats.pagamentosAndamento, color: '#93278F' },
                            { label: 'Pagos', value: stats.pagamentosPagos, color: '#10B981' }
                          ];
                          const total = stats.totalPagamentos || 1;
                          return rows.map((r, i) => {
                            const pct = (r.value / total) * 100;
                            const start = rows.slice(0, i).reduce((a, s) => a + (s.value / total) * 100, 0);
                            return `${r.color} ${start}% ${start + pct}%`;
                          }).join(', ');
                        })()})`
                      }}>
                        <div className="donut-center">
                          <strong>{stats.totalPagamentos}</strong>
                          <span>Total</span>
                        </div>
                      </div>
                      <div className="donut-legend">
                        {(() => {
                          const rows = [
                            { label: 'Aguardando prazo', value: stats.pagamentosAguardando, color: '#D9E021' },
                            { label: 'Em andamento', value: stats.pagamentosAndamento, color: '#93278F' },
                            { label: 'Pagos', value: stats.pagamentosPagos, color: '#10B981' }
                          ];
                          return rows.map((r, i) => (
                            <div key={i} className="legend-item">
                              <span className="legend-dot" style={{ background: r.color }} />
                              <span className="legend-label">{r.label}</span>
                              <span className="legend-value">
                                {r.value}
                                <span className="legend-pct"> · {Math.round((r.value / stats.totalPagamentos) * 100)}%</span>
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  ) : <p className="chart-empty">Nenhum dado de pagamento</p>}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="dash-section">
          <div className="dash-section-head">
            <h3 className="dash-section-title">Análises</h3>
            <p className="dash-section-sub">Distribuição do portfólio de propriedade intelectual</p>
          </div>
          <div className="dashboard-grid">
          {showPI && (
            <div className="chart-card">
              <h3 className="chart-title">
                <FileText size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-primary)' }} />
                PIs por Status
              </h3>
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
                        <span className="legend-value">
                          {s.value}
                          {stats.total > 0 && <span className="legend-pct"> · {Math.round((s.value / stats.total) * 100)}%</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {showPI && (
            <div className="chart-card">
              <h3 className="chart-title">
                <BookOpen size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-primary)' }} />
                PIs por Tipo
              </h3>
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
              <h3 className="chart-title">
                <TrendingUp size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-primary)' }} />
                PIs por Ano
              </h3>
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
              <h3 className="chart-title">
                <Users size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-accent)' }} />
                Autores por Vínculo
              </h3>
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
        </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
