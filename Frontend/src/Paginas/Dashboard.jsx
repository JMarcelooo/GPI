import API_URL from '../config';
import { useState, useEffect } from 'react';
import {
  FileText, Users, TrendingUp, Download, Clock, Award, DollarSign, GitBranch,
  Briefcase, CreditCard, Timer, PieChart
} from 'lucide-react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import AlterarSenhaModal from '../Components/AlterarSenhaModal';
import { useAuth } from '../contexts/AuthContext';
import '../Tela2.css';
import './Dashboard.css';

const EMPTY_FUNIL = { emAnalise: 0, deferida: 0, registradaOuCarta: 0, indeferidaOuAnulada: 0, arquivada: 0, taxaSucesso: 0, taxaInsucesso: 0, comDesfecho: 0 };

const STATUS_META = {
  'em analise': { color: 'var(--chart-orange)', label: 'Em análise' },
  'deferida': { color: 'var(--chart-lime)', label: 'Deferida' },
  'registrada': { color: 'var(--chart-primary)', label: 'Registrada' },
  'carta patente': { color: 'var(--chart-primary-light)', label: 'Carta patente' },
  'indeferida': { color: 'var(--chart-error)', label: 'Indeferida' },
  'anulada': { color: 'var(--chart-pink)', label: 'Anulada' },
  'arquivada': { color: 'var(--chart-gray)', label: 'Arquivada' }
};

const CHART_COLORS = ['var(--chart-primary)', 'var(--chart-pink)', 'var(--chart-orange)', 'var(--chart-lime)', 'var(--chart-primary-light)', 'var(--chart-green)', 'var(--chart-cyan)', 'var(--chart-gray)'];

function Dashboard() {
  document.title = 'GPI - Dashboard';
  const { user, updateUser } = useAuth();
  const [showForcaTroca, setShowForcaTroca] = useState(!!user?.deveTrocarSenha);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    total: 0, ativos: 0, emProcesso: 0, pendentes: 0,
    porStatus: [], porTipo: [], porAno: [],
    totalAutores: 0, autoresPorVinculo: [],
    totalPagamentos: 0, pagamentosPagos: 0, pagamentosAguardando: 0, pagamentosAndamento: 0,
    totalInvestido: 0, custoMedioPorPI: 0, custoPorSucesso: 0, tempoMedioDias: null,
    funil: EMPTY_FUNIL
  });

  useEffect(() => {
    axios.get(`${API_URL}/api/stats`)
      .then(res => {
        const { pi, autores, pagamentos } = res.data;
        setStats({
          total: pi.total, ativos: pi.ativos, emProcesso: pi.emProcesso, pendentes: pi.pendentes,
          porStatus: pi.porStatus, porTipo: pi.porTipo, porAno: pi.porAno,
          totalAutores: autores.total, autoresPorVinculo: autores.porVinculo,
          totalPagamentos: pagamentos.total,
          pagamentosPagos: pagamentos.pago,
          pagamentosAguardando: pagamentos.aguardandoPrazo,
          pagamentosAndamento: pagamentos.emAndamento,
          totalInvestido: pi.totalInvestido || 0,
          custoMedioPorPI: pi.custoMedioPorPI || 0,
          custoPorSucesso: pi.custoPorSucesso || 0,
          tempoMedioDias: pi.tempoMedioDias,
          funil: pi.funil || EMPTY_FUNIL
        });
        setError(null);
      })
      .catch(err => {
        console.error("Erro ao carregar dados:", err);
        setError('Não foi possível carregar os dados do dashboard.');
      })
      .finally(() => setLoading(false));
  }, []);

  const fmtBRL = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const fmtDias = d => d === null || d === undefined ? '—' :
    d >= 365 ? `${Math.round((d / 365) * 10) / 10} anos` : `${Math.round(d)} dias`;

  const maxTipo = Math.max(1, ...stats.porTipo.map(t => t.value));
  const maxAno = Math.max(1, ...stats.porAno.map(a => a.value));
  const maxVinculo = Math.max(1, ...stats.autoresPorVinculo.map(v => v.value));

  // ---- KPIs ----
  const kpis = [
    { label: 'Total de PIs', value: stats.total, icon: FileText, tone: 'primary', sub: `${stats.ativos} ativas` },
    { label: 'Em análise', value: stats.emProcesso, icon: Timer, tone: 'warning', sub: '' },
    { label: 'Taxa de sucesso', value: `${stats.funil.taxaSucesso}%`, icon: Award, tone: 'success', sub: `${stats.funil.comDesfecho} com desfecho` },
    { label: 'Investimento total', value: fmtBRL(stats.totalInvestido), icon: DollarSign, tone: 'info', sub: `médio ${fmtBRL(stats.custoMedioPorPI)}/PI` },
  ];

  // ---- Charts data ----
  const funilEtapas = [
    { label: 'Em análise', value: stats.funil.emAnalise, color: 'var(--chart-orange)' },
    { label: 'Deferida', value: stats.funil.deferida, color: 'var(--chart-lime)' },
    { label: 'Registrada / Carta', value: stats.funil.registradaOuCarta, color: 'var(--chart-green)' },
    { label: 'Indeferida / Anulada', value: stats.funil.indeferidaOuAnulada, color: 'var(--chart-pink)' },
    { label: 'Arquivada', value: stats.funil.arquivada, color: 'var(--chart-gray)' }
  ];
  const maxEtapa = Math.max(1, ...funilEtapas.map(e => e.value));

  const pagRows = [
    { label: 'Pagos', value: stats.pagamentosPagos, color: 'var(--color-success)' },
    { label: 'Em andamento', value: stats.pagamentosAndamento, color: 'var(--color-primary)' },
    { label: 'Aguardando', value: stats.pagamentosAguardando, color: 'var(--color-warning)' }
  ];

  return (
    <div className="container">
      <Sidebar />
      {showForcaTroca && (
        <AlterarSenhaModal
          forcada
          onSuccess={() => updateUser({ deveTrocarSenha: false })}
          onClose={() => setShowForcaTroca(false)}
        />
      )}

      <div className="main">
        <header className="dash-header">
          <div>
            <h1 className="dash-title">Dashboard</h1>
            <p className="dash-subtitle">
              Visão geral · {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button className="btn-relatorio" onClick={() => window.print()}>
            <Download size={16} /> Relatório
          </button>
        </header>

        {loading && (
          <div className="dash-loading">
            <div className="dash-loading-spinner" role="status" aria-label="Carregando"></div>
            <p>Carregando dados...</p>
          </div>
        )}

        {error && (
          <div className="dash-error" role="alert">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        )}

        {!loading && !error && (
        <>
        {/* Bonus: Tempo médio e custo por sucesso como highlights compactos */}
        <div className="dash-insight-bar">
          <div className="insight-item">
            <Clock size={16} />
            <span><strong>Tempo médio</strong> {fmtDias(stats.tempoMedioDias)}</span>
          </div>
          <div className="insight-item">
            <CreditCard size={16} />
            <span><strong>Custo/sucesso</strong> {fmtBRL(stats.custoPorSucesso)}</span>
          </div>
          <div className="insight-item">
            <Users size={16} />
            <span><strong>Autores</strong> {stats.totalAutores}</span>
          </div>
          <div className="insight-item">
            <Briefcase size={16} />
            <span><strong>Pagamentos</strong> {stats.totalPagamentos}</span>
          </div>
        </div>

        <section className="kpi-grid">
          {kpis.map(k => (
            <div key={k.label} className={`kpi-card kpi--${k.tone}`}>
              <div className="kpi-icon" style={{ background: `var(--color-${k.tone}-bg)`, color: `var(--color-${k.tone})` }}>
                <k.icon size={20} />
              </div>
              <div className="kpi-info">
                <strong className="kpi-value">{k.value}</strong>
                <span className="kpi-label">{k.label}</span>
                {k.sub && <span className="kpi-sub">{k.sub}</span>}
              </div>
            </div>
          ))}
        </section>

        <section className="chart-grid">
          <div className="chart-card chart-card--wide">
            <h3 className="chart-title">
              <GitBranch size={15} /> Funil de conversão
            </h3>
            <div className="funnel">
              {funilEtapas.map(st => (
                <div key={st.label} className="funnel-row">
                  <span className="bar-label funnel-label" title={st.label}>{st.label}</span>
                  <div className="bar-track funnel-track">
                    <div className="bar-fill" style={{ width: `${(st.value / maxEtapa) * 100}%`, background: st.color }} />
                  </div>
                  <span className="bar-value">{st.value}</span>
                </div>
              ))}
              <div className="funnel-meta">
                <span><strong>{stats.funil.taxaSucesso}%</strong> sucesso · <strong>{stats.funil.taxaInsucesso}%</strong> insucesso</span>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <PieChart size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-primary)' }} />
              PIs por status
            </h3>
            <DonutChart total={stats.total} rows={stats.porStatus.map((s, i) => ({
              label: STATUS_META[s.label]?.label || s.label,
              value: s.value,
              color: CHART_COLORS[i % CHART_COLORS.length]
            }))} />
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <TrendingUp size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-primary)' }} />
              PIs por ano
            </h3>
            <AnoChart data={stats.porAno} max={maxAno} />
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <FileText size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-primary)' }} />
              PIs por tipo
            </h3>
            <Bars rows={stats.porTipo.map(t => ({ label: t.label, value: t.value }))} max={maxTipo} color={['var(--chart-primary)', 'var(--chart-primary-light)', 'var(--chart-orange)', 'var(--chart-lime)']} />
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <DollarSign size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-primary)' }} />
              Pagamentos
            </h3>
            <DonutChart total={stats.totalPagamentos} rows={pagRows} />
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <Users size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-accent)' }} />
              Autores por vínculo
            </h3>
            <Bars rows={stats.autoresPorVinculo.map(v => ({ label: v.label, value: v.value }))} max={maxVinculo} color={['var(--chart-primary-light)', 'var(--chart-orange)', 'var(--chart-lime)', 'var(--chart-green)', 'var(--chart-cyan)']} />
          </div>
        </section>
        </>
        )}
      </div>
    </div>
  );
}

// ---- Donut chart ----
function DonutChart({ total = 0, rows }) {
  const center = total || 0;
  const t = center || 1;
  return (
    <div className="donut-container">
      <div className="donut" style={{
        background: `conic-gradient(${rows.map((r, i) => {
          const pct = (r.value / t) * 100;
          const start = rows.slice(0, i).reduce((a, s) => a + (s.value / t) * 100, 0);
          return `${r.color} ${start}% ${start + pct}%`;
        }).join(', ')})`
      }}>
        <div className="donut-center">
          <strong>{center}</strong>
          <span>total</span>
        </div>
      </div>
      <div className="donut-legend">
        {rows.map((r, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ background: r.color }} />
            <span className="legend-label">{r.label}</span>
            <span className="legend-value">
              {r.value} <span className="legend-pct">({Math.round((r.value / t) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Horizontal bars ----------
function Bars({ rows, max, color }) {
  if (!rows.length) return <p className="chart-empty">Nenhum dado</p>;
  return (
    <div className="bar-chart-h">
      {rows.map((r, i) => (
        <div key={i} className="bar-row">
          <span className="bar-label" title={r.label}>{r.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(r.value / max) * 100}%`, background: color[i % color.length] }} />
          </div>
          <span className="bar-value">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- Line chart (anos) ----------
function AnoChart({ data, max }) {
  if (!data.length) return <p className="chart-empty">Nenhum dado</p>;
  const step = 46;
  const N = data.length;
  const width = 70 + (N - 1) * step;
  const xOf = i => 30 + i * step;
  const yOf = v => 130 - (v / max) * 100;
  return (
    <div className="line-chart-scroll">
      <svg viewBox={`0 0 ${width} 150`} className="line-chart-svg" style={{ width }}>
        <polyline
          points={data.map((a, i) => `${xOf(i)},${yOf(a.value)}`).join(' ')}
          fill="none" stroke="var(--chart-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />
        {data.map((a, i) => (
          <g key={i}>
            <circle cx={xOf(i)} cy={yOf(a.value)} r="4" fill="var(--color-surface)" stroke="var(--chart-primary)" strokeWidth="2" />
            <text x={xOf(i)} y={142} textAnchor="middle" fontSize="11" fill="var(--color-text-muted)">{a.label}</text>
            <text x={xOf(i)} y={yOf(a.value) - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-text)">{a.value}</text>
          </g>
        ))}
        <line x1="30" y1="130" x2={width - 40} y2="130" stroke="var(--color-border)" strokeWidth="1" />
      </svg>
    </div>
  );
}

export default Dashboard;