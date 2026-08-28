import API_URL from '../config';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, DollarSign, GitMerge, Activity, AlertTriangle,
  CheckCircle2, Clock, Award, TrendingUp, Download, Briefcase, CreditCard, PieChart,
  Building2, GraduationCap, CalendarClock, ListOrdered
} from 'lucide-react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import AlterarSenhaModal from '../Components/AlterarSenhaModal';
import { useAuth } from '../contexts/AuthContext';
import '../Tela2.css';
import './Dashboard.css';

const PALETTE = ['#93278F', '#FA0183', '#FA7F0C', '#009FDF', '#D9E021'];

const CHART_COLORS = PALETTE;

const TIPO_COLORS = {
  'patente de invencao': PALETTE[0],
  'modelo de utilidade': PALETTE[1],
  'marca': PALETTE[2],
  'programa de computador': PALETTE[3]
};
const tipoColor = t => TIPO_COLORS[t] || CHART_COLORS[(t || '').length % CHART_COLORS.length];

const TIPO_LABELS = {
  'patente de invencao': 'Patente de Invenção',
  'modelo de utilidade': 'Modelo de Utilidade',
  'marca': 'Marca',
  'programa de computador': 'Programa de Computador'
};
const tipoLabel = t => TIPO_LABELS[t] || (t ? String(t).replace(/\b\w/g, c => c.toUpperCase()) : t);

const STATUS_LABELS = {
  'deferida': 'Deferida',
  'registrada': 'Registrada',
  'carta patente': 'Carta Patente',
  'indeferida': 'Indeferida',
  'anulada': 'Anulada',
  'arquivada': 'Arquivada',
  'em analise': 'Em análise'
};
const statusLabel = s => STATUS_LABELS[s] || (s ? String(s).replace(/\b\w/g, c => c.toUpperCase()) : s);

const GENDER_META = {
  'masculino': { label: 'Masculino', color: PALETTE[0] },
  'feminino': { label: 'Feminino', color: PALETTE[1] },
  'nao_informado': { label: 'Não informado', color: PALETTE[3] }
};
const normalizeGender = g => {
  if (g == null || g === '' || g === '—') return 'nao_informado';
  const s = String(g).toLowerCase();
  if (s === 'm' || s === 'masculino') return 'masculino';
  if (s === 'f' || s === 'feminino') return 'feminino';
  if (s.includes('inform')) return 'nao_informado';
  return s;
};
const genderLabel = g => GENDER_META[normalizeGender(g)]?.label || 'Não informado';
const genderColor = g => GENDER_META[normalizeGender(g)]?.color || PALETTE[3];

const SUCESSO = ['deferida', 'registrada', 'carta patente'];

const TABS = [
  { key: 'geral', label: 'Visão Geral', icon: LayoutDashboard },
  { key: 'autores', label: 'Autores', icon: Users },
  { key: 'pis', label: 'PIs', icon: FileText },
  { key: 'fin', label: 'Financeiro', icon: DollarSign },
  { key: 'cruz', label: 'Cruzamentos', icon: GitMerge }
];

function Dashboard() {
  document.title = 'GPI - Dashboard';
  const { user, updateUser } = useAuth();
  const [showForcaTroca, setShowForcaTroca] = useState(!!user?.deveTrocarSenha);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('geral');
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/stats`)
      .then(res => { setData(res.data); setError(null); })
      .catch(err => { console.error('Erro ao carregar dados:', err); setError('Não foi possível carregar os dados do dashboard.'); })
      .finally(() => setLoading(false));
  }, []);

  const fmtBRL = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const fmtDias = d => (d === null || d === undefined) ? '—' : (d >= 365 ? `${Math.round((d / 365) * 10) / 10} anos` : `${Math.round(d)} dias`);
  const fmtPct = v => `${v || 0}%`;
  const fmtDate = s => { if (!s) return '—'; const d = new Date(s); return isNaN(d) ? '—' : d.toLocaleDateString('pt-BR'); };

  if (loading) {
    return (
      <div className="container">
        <Sidebar />
        <div className="main">
          <div className="dash-loading">
            <div className="dash-loading-spinner" role="status" aria-label="Carregando"></div>
            <p>Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container">
        <Sidebar />
        <div className="main">
          <div className="dash-error" role="alert">
            <p>{error || 'Sem dados.'}</p>
            <button onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        </div>
      </div>
    );
  }

  const { pi, autores, pagamentos, cruzamentos } = data;

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

        <nav className="dash-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`dash-tab ${tab === t.key ? 'dash-tab--active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="dash-tabpanel">
          {tab === 'geral' && <VisaoGeral pi={pi} autores={autores} pagamentos={pagamentos} fmtBRL={fmtBRL} fmtDias={fmtDias} fmtPct={fmtPct} />}
          {tab === 'autores' && <AutoresTab autores={autores} fmtBRL={fmtBRL} />}
          {tab === 'pis' && <PisTab pi={pi} autores={autores} fmtBRL={fmtBRL} fmtDias={fmtDias} fmtPct={fmtPct} />}
          {tab === 'fin' && <FinanceiroTab pagamentos={pagamentos} pi={pi} fmtBRL={fmtBRL} fmtDate={fmtDate} />}
          {tab === 'cruz' && <CruzamentosTab cruzamentos={cruzamentos} autores={autores} pi={pi} fmtBRL={fmtBRL} />}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone = 'primary', sub }) {
  return (
    <div className={`kpi-card kpi--${tone}`}>
      <div className="kpi-icon" style={{ background: `var(--color-${tone}-bg)`, color: `var(--color-${tone})` }}>
        <Icon size={20} />
      </div>
      <div className="kpi-info">
        <span className="kpi-label">{label}</span>
        <strong className="kpi-value">{value}</strong>
        {sub && <span className="kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children, wide, className = '' }) {
  return (
    <div className={`chart-card ${wide ? 'chart-card--wide' : ''} ${className}`}>
      <h3 className="chart-title">
        {Icon && <Icon size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-primary)' }} />}
        {title}
      </h3>
      {children}
    </div>
  );
}

function VisaoGeral({ pi, autores, pagamentos, fmtBRL, fmtDias, fmtPct }) {
  pi = pi || {};
  autores = autores || {};
  pagamentos = pagamentos || {};
  const statusCount = label => (pi.porStatus || []).find(s => s.label === label)?.value || 0;
  const concedidas = ['deferida', 'registrada', 'carta patente'].reduce((a, s) => a + statusCount(s), 0);
  const emAndamento = statusCount('em analise');
  const indeferidas = ['indeferida', 'anulada', 'arquivada'].reduce((a, s) => a + statusCount(s), 0);
  const total = pi.total || 1;

  const funilEtapas = [
    { label: 'Em análise', value: pi.funil.emAnalise, color: PALETTE[2] },
    { label: 'Deferida', value: pi.funil.deferida, color: PALETTE[3] },
    { label: 'Registrada / Carta', value: pi.funil.registradaOuCarta, color: PALETTE[0] },
    { label: 'Indeferida / Anulada', value: pi.funil.indeferidaOuAnulada, color: PALETTE[1] },
    { label: 'Arquivada', value: pi.funil.arquivada, color: PALETTE[4] }
  ];

  return (
    <>
      <section className="kpi-grid">
        <Kpi label="Total de PIs" value={pi.total} icon={FileText} tone="primary" sub={`${pi.ativos} ativas`} />
        <Kpi label="Autores" value={autores.total} icon={Users} tone="info" />
        <Kpi label="Valor total pago" value={fmtBRL(pagamentos.valorPago || 0)} icon={CheckCircle2} tone="success" />
        <Kpi label="Valor pendente" value={fmtBRL(pagamentos.valorPendente || 0)} icon={Clock} tone="warning" />
        <Kpi label="Taxa de sucesso" value={fmtPct(pi.funil.taxaSucesso)} icon={Award} tone="accent" sub={`${pi.funil.comDesfecho} com desfecho`} />
      </section>

      <section className="geral-layout">
        <div className="geral-left">
          <Card title="Distribuição de resultados" icon={Activity}>
            <StatusBreakdown concedidas={concedidas} emAndamento={emAndamento} indeferidas={indeferidas} total={total} fmtPct={fmtPct} />
          </Card>

          <Card title="Funil de status das PIs" icon={GitMerge} className="geral-funnel-card">
            <Bars rows={funilEtapas} max={Math.max(1, ...funilEtapas.map(e => e.value))} color={funilEtapas.map(e => e.color)} />
            <div className="funnel-meta">
              <span><strong>{pi.funil.taxaSucesso}%</strong> sucesso · <strong>{pi.funil.taxaInsucesso}%</strong> insucesso</span>
            </div>
          </Card>
        </div>

        <Card title="PIs por tipo" icon={PieChart} className="geral-tipo-card">
          <DonutChart total={pi.total} stacked rows={pi.porTipo.map((s, i) => ({ label: tipoLabel(s.label), value: s.value, color: tipoColor(s.label) }))} />
        </Card>
      </section>
    </>
  );
}

function StatusBreakdown({ concedidas, emAndamento, indeferidas, total, fmtPct }) {
  const seg = [
    { label: 'Concedidas', value: concedidas, color: PALETTE[3] },
    { label: 'Em andamento', value: emAndamento, color: PALETTE[2] },
    { label: 'Indeferidas', value: indeferidas, color: PALETTE[1] }
  ];
  const t = total || 1;
  return (
    <div className="status-breakdown">
      <div className="semaforo-bar">
        {seg.map(s => s.value > 0 && (
          <div key={s.label} className="semaforo-seg" style={{ width: `${(s.value / t) * 100}%`, background: s.color }} title={`${s.label}: ${s.value}`} />
        ))}
      </div>
      <div className="status-breakdown-legend">
        {seg.map(s => (
          <div key={s.label} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="legend-label">{s.label}</span>
            <span className="legend-value">{s.value} <span className="legend-pct">({fmtPct(Math.round((s.value / t) * 100))})</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutoresTab({ autores, fmtBRL }) {
  return (
    <>
      <section className="kpi-grid">
        <Kpi label="Total de autores" value={autores.total} icon={Users} tone="primary" />
        <Kpi label="Com gênero informado" value={autores.porGenero.filter(g => g.label !== 'Nao informado' && g.label !== 'Não informado').reduce((a, g) => a + g.value, 0)} icon={Activity} tone="info" />
        <Kpi label="Campi" value={autores.porCampus.length} icon={Building2} tone="warning" />
        <Kpi label="Departamentos" value={autores.porDepartamento.length} icon={GraduationCap} tone="success" />
      </section>

      <section className="autores-layout">
        <div className="autores-left">
          <div className="autores-top-row">
            <Card title="Distribuição por gênero" icon={Activity}>
              <DonutChart total={autores.total} rows={autores.porGenero.map(g => ({ label: genderLabel(g.label), value: g.value, color: genderColor(g.label) }))} />
            </Card>
            <Card title="Autores por vínculo" icon={Users}>
              <Bars rows={autores.porVinculo} max={Math.max(1, ...autores.porVinculo.map(v => v.value))} color={CHART_COLORS} />
            </Card>
          </div>
          <Card title="Autores por campus" icon={Building2}>
            <Bars rows={autores.porCampus} max={Math.max(1, ...autores.porCampus.map(c => c.value))} color={CHART_COLORS} />
          </Card>
        </div>
        <Card title="Ranking de autores mais produtivos" icon={ListOrdered} className="autores-ranking-card">
          <Ranking rows={autores.topAutores.map(a => ({ label: a.name, value: a.pis, suffix: 'PIs' }))} />
        </Card>
      </section>
    </>
  );
}

function PisTab({ pi, autores, fmtBRL, fmtDias, fmtPct }) {
  pi = pi || {};
  autores = autores || {};
  const funilEtapas = [
    { label: 'Em análise', value: pi.funil.emAnalise, color: PALETTE[2] },
    { label: 'Deferida', value: pi.funil.deferida, color: PALETTE[3] },
    { label: 'Registrada / Carta', value: pi.funil.registradaOuCarta, color: PALETTE[0] },
    { label: 'Indeferida / Anulada', value: pi.funil.indeferidaOuAnulada, color: PALETTE[1] },
    { label: 'Arquivada', value: pi.funil.arquivada, color: PALETTE[4] }
  ];
  return (
    <>
      <section className="kpi-grid">
        <Kpi label="Total de PIs" value={pi.total} icon={FileText} tone="primary" sub={`${pi.ativos} ativas`} />
        <Kpi label="Em processo" value={pi.emProcesso} icon={Clock} tone="warning" />
        <Kpi label="Pendentes (terminal)" value={pi.pendentes} icon={AlertTriangle} tone="error" />
        <Kpi label="Tempo médio" value={fmtDias(pi.tempoMedioDias)} icon={Activity} tone="info" sub={`custo médio ${fmtBRL(pi.custoMedioPorPI)}/PI`} />
      </section>

      <section className="chart-grid">
        <Card title="Evolução temporal por tipo de PI" icon={TrendingUp}>
          <LineTiposChart rows={pi.porAnoTipo || []} />
        </Card>
        <Card title="PIs por tipo" icon={FileText}>
          <Bars rows={(pi.porTipo || []).map(t => ({ label: tipoLabel(t.label), value: t.value }))} max={Math.max(1, ...(pi.porTipo || []).map(t => t.value))} color={CHART_COLORS} />
        </Card>
        <Card title="Funil de status detalhado" icon={GitMerge}>
          <Bars rows={funilEtapas} max={Math.max(1, ...funilEtapas.map(e => e.value))} color={funilEtapas.map(e => e.color)} />
          <div className="funnel-meta">
            <span><strong>{pi.funil.taxaSucesso}%</strong> sucesso · <strong>{pi.funil.taxaInsucesso}%</strong> insucesso</span>
          </div>
        </Card>
        <Card title="PIs por titular / instituição" icon={Building2}>
          <Bars rows={pi.porTitular || []} max={Math.max(1, ...(pi.porTitular || []).map(t => t.value))} color={CHART_COLORS} />
        </Card>
      </section>
    </>
  );
}

function FinanceiroTab({ pagamentos, pi, fmtBRL, fmtDate }) {
  pagamentos = pagamentos || {};
  pi = pi || {};
  const semaforo = pagamentos.semaforo || { vencidos: 0, emDia: 0, futuros: 0 };
  const proximos = pagamentos.proximosVencimentos || [];
  return (
    <>
      <section className="kpi-grid">
        <Kpi label="Valor pago" value={fmtBRL(pagamentos.valorPago || 0)} icon={CheckCircle2} tone="success" />
        <Kpi label="Valor pendente" value={fmtBRL(pagamentos.valorPendente || 0)} icon={Clock} tone="warning" />
        <Kpi label="Custo médio / PI" value={fmtBRL(pi.custoMedioPorPI || 0)} icon={Briefcase} tone="primary" sub={`por sucesso ${fmtBRL(pi.custoPorSucesso || 0)}`} />
        <Kpi label="Pagamentos vencidos" value={semaforo.vencidos} icon={AlertTriangle} tone="error" />
        <Kpi label="A vencer (30 dias)" value={pagamentos.aVencer30 || 0} icon={CalendarClock} tone="info" />
        <Kpi label="Total de pagamentos" value={pagamentos.total || 0} icon={CreditCard} tone="accent" />
      </section>

      <section className="fin-layout">
        <div className="fin-left">
          <div className="fin-top">
            <Card title="Valor pago por ano" icon={TrendingUp}>
              <AnoChart data={(pagamentos.porAnoPago || []).map(d => ({ label: String(d.ano), value: d.value }))} valueFmt={fmtBRL} />
            </Card>
            <Card title="Situação dos pagamentos" icon={PieChart}>
              <DonutChart total={pagamentos.total || 0} rows={[
                { label: 'Pagos', value: pagamentos.pago || 0, color: PALETTE[4] },
                { label: 'Em andamento', value: pagamentos.emAndamento || 0, color: PALETTE[0] },
                { label: 'Aguardando', value: pagamentos.aguardandoPrazo || 0, color: PALETTE[2] }
              ]} />
            </Card>
          </div>
          <Card title="Custo médio por tipo de PI" icon={DollarSign} className="fin-custo">
            <VerticalBars rows={(pagamentos.custoMedioPorTipo || []).map(t => ({ label: tipoLabel(t.label), value: t.value }))} color={CHART_COLORS} valueFmt={fmtBRL} />
          </Card>
        </div>
        <Card title="Próximos vencimentos" icon={CalendarClock} className="fin-venc">
          <Upcoming rows={proximos} fmtDate={fmtDate} fmtBRL={fmtBRL} />
        </Card>
      </section>
    </>
  );
}

function CruzamentosTab({ cruzamentos, autores, pi, fmtBRL }) {
  cruzamentos = cruzamentos || {};
  autores = autores || {};
  pi = pi || {};
  const invest = cruzamentos.investimentoPorStatus || [];
  const totalInvest = invest.reduce((a, s) => a + Number(s.value || 0), 0);
  const risco = invest.filter(s => !SUCESSO.includes(s.label)).reduce((a, s) => a + Number(s.value || 0), 0);
  const riscoPct = totalInvest ? Math.round((risco / totalInvest) * 100) : 0;

  return (
    <>
      <section className="kpi-grid">
        <Kpi label="Investimento total" value={fmtBRL(pi.totalInvestido || 0)} icon={Briefcase} tone="primary" sub={`custo médio ${fmtBRL(pi.custoMedioPorPI || 0)}/PI`} />
        <Kpi label="Risco (não concedidas)" value={fmtBRL(risco)} icon={AlertTriangle} tone="error" sub={`${riscoPct}% do investimento`} />
        <Kpi label="Departamentos ativos" value={(cruzamentos.produtividadePorDepartamento || []).length} icon={GraduationCap} tone="success" />
        <Kpi label="Campi ativos" value={(cruzamentos.produtividadePorCampus || []).length} icon={Building2} tone="warning" />
      </section>

      <section className="chart-grid">
        <Card title="Investimento por status da PI" icon={PieChart}>
          <Bars rows={invest.map(s => ({ label: statusLabel(s.label), value: s.value }))} max={Math.max(1, ...invest.map(s => s.value))} color={CHART_COLORS} valueFmt={fmtBRL} />
          <p className="card-note">Risco financeiro (PIs ainda não concedidas): <strong>{fmtBRL(risco)}</strong></p>
        </Card>
        <Card title="Heatmap gênero × vínculo × PIs" icon={Activity}>
          <Heatmap rows={cruzamentos.generoVinculoPIs || []} />
        </Card>
        <Card title="Produtividade por departamento (PIs)" icon={GraduationCap}>
          <Bars rows={cruzamentos.produtividadePorDepartamento || []} max={Math.max(1, ...(cruzamentos.produtividadePorDepartamento || []).map(d => d.value))} color={CHART_COLORS} />
        </Card>
        <Card title="Produtividade por campus (PIs)" icon={Building2}>
          <Bars rows={cruzamentos.produtividadePorCampus || []} max={Math.max(1, ...(cruzamentos.produtividadePorCampus || []).map(c => c.value))} color={CHART_COLORS} />
        </Card>
        <Card title="Custo médio por tipo de PI" icon={DollarSign}>
          <Bars rows={(cruzamentos.custoMedioPorTipo || []).map(t => ({ label: tipoLabel(t.label), value: t.value }))} max={Math.max(1, ...(cruzamentos.custoMedioPorTipo || []).map(t => t.value))} color={CHART_COLORS} valueFmt={fmtBRL} />
        </Card>
        <Card title="Top 10 departamentos (autores)" icon={GraduationCap}>
          <Ranking rows={(autores.porDepartamento || []).slice(0, 10).map(d => ({ label: d.label, value: d.value, suffix: 'autores' }))} />
        </Card>
      </section>
    </>
  );
}

function LineTiposChart({ rows }) {
  rows = rows || [];
  if (!rows.length) return <p className="chart-empty">Nenhum dado</p>;
  const anos = [...new Set(rows.map(r => r.ano))].sort();
  const tipos = [...new Set(rows.map(r => r.tipo))];
  const get = (a, t) => rows.find(r => r.ano === a && r.tipo === t)?.value || 0;
  const max = Math.max(1, ...anos.flatMap(a => tipos.map(t => get(a, t))));
  const step = 46;
  const N = anos.length;
  const width = 70 + (N - 1) * step;
  const xOf = i => 30 + i * step;
  const yOf = v => 130 - (v / max) * 100;
  const yticks = [0, Math.round(max / 2), max];
  return (
    <div>
      <div className="line-chart-scroll">
        <svg viewBox={`0 0 ${width} 150`} className="line-chart-svg" style={{ width }}>
          {yticks.map(v => (
            <g key={v}>
              <line x1="30" y1={yOf(v)} x2={width - 40} y2={yOf(v)} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3 3" />
              <text x="26" y={yOf(v) + 3} textAnchor="end" fontSize="10" fill="var(--color-text-muted)">{v}</text>
            </g>
          ))}
          {tipos.map(t => (
            <polyline
              key={t}
              points={anos.map((a, i) => `${xOf(i)},${yOf(get(a, t))}`).join(' ')}
              fill="none" stroke={tipoColor(t)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            />
          ))}
          {tipos.flatMap(t =>
            anos.map((a, i) => (
              <circle key={`${t}-${a}`} cx={xOf(i)} cy={yOf(get(a, t))} r="3.5" fill="var(--color-surface)" stroke={tipoColor(t)} strokeWidth="2" />
            ))
          )}
          {anos.map((a, i) => (
            <text key={a} x={xOf(i)} y={145} textAnchor="middle" fontSize="11" fill="var(--color-text-muted)">{a}</text>
          ))}
        </svg>
      </div>
      <div className="chart-legend">
        {tipos.map(t => (
          <div key={t} className="legend-item">
            <span className="legend-dot" style={{ background: tipoColor(t) }} />
            <span className="legend-label">{tipoLabel(t)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Heatmap({ rows }) {
  rows = rows || [];
  if (!rows.length) return <p className="chart-empty">Nenhum dado</p>;
  const bonds = [...new Set(rows.map(r => r.bond || 'Sem vínculo'))];
  const genders = [...new Set(rows.map(r => r.gender || 'nao_informado'))];
  const max = Math.max(1, ...rows.map(r => r.value));
  const get = (g, b) => rows.find(r => (r.gender || 'nao_informado') === g && (r.bond || 'Sem vínculo') === b)?.value || 0;
  return (
    <div className="heatmap">
      <div className="heatmap-row heatmap-head">
        <span className="heatmap-row-label" />
        {bonds.map(b => <span key={b} className="heatmap-col-label">{b}</span>)}
      </div>
      {genders.map(g => (
        <div key={g} className="heatmap-row">
          <span className="heatmap-row-label">{genderLabel(g)}</span>
          {bonds.map(b => {
            const v = get(g, b);
            const op = Math.round((v / max) * 100);
            return (
              <div
                key={b}
                className="heatmap-cell"
                style={{ background: v ? `color-mix(in srgb, ${genderColor(g)} ${op}%, transparent)` : 'var(--color-bg)' }}
                title={`${genderLabel(g)} · ${b}: ${v} PIs`}
              >
                {v || ''}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Ranking({ rows }) {
  rows = rows || [];
  if (!rows.length) return <p className="chart-empty">Nenhum dado</p>;
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <div className="ranking">
      {rows.map((r, i) => (
        <div key={i} className="ranking-row">
          <span className="ranking-pos">{i + 1}</span>
          <span className="ranking-name" title={r.label}>{r.label}</span>
          <div className="bar-track ranking-track">
            <div className="bar-fill" style={{ width: `${(r.value / max) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
          </div>
          <span className="bar-value">{r.value} {r.suffix || ''}</span>
        </div>
      ))}
    </div>
  );
}

function Upcoming({ rows, fmtDate, fmtBRL }) {
  if (!rows.length) return <p className="chart-empty">Nenhum vencimento pendente</p>;
  return (
    <div className="upcoming">
      <div className="upcoming-head">
        <span>Tipo</span><span>Valor</span><span>Vencimento</span><span>Status</span>
      </div>
      {rows.map(r => {
        const hoje = new Date();
        const venc = r.vencimento ? new Date(r.vencimento) : null;
        const dias = venc ? Math.round((venc - hoje) / 86400000) : null;
        const status = (dias !== null && dias < 0) ? 'vencido' : (dias !== null && dias <= 30) ? 'proximo' : 'emdia';
        return (
          <Link key={r.id} to={`/detalhes/${r.pi_id}`} className={`upcoming-row upcoming--${status}`}>
            <span className="upcoming-tipo" title={r.tipo}>{r.tipo}</span>
            <span className="upcoming-valor">{fmtBRL(r.valor)}</span>
            <span className="upcoming-date">{fmtDate(r.vencimento)}</span>
            <span className={`upcoming-badge upcoming-badge--${status}`}>
              {status === 'vencido' ? 'Vencido' : status === 'proximo' ? 'Próximo' : 'Em dia'}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function DonutChart({ total = 0, rows, stacked = false }) {
  rows = rows || [];
  total = total || 0;
  if (!total || !rows.length) return <p className="chart-empty">Nenhum dado</p>;
  const t = total || 1;
  return (
    <div className={`donut-container ${stacked ? 'donut-container--stacked' : ''}`}>
      <div className="donut" style={{
        background: `conic-gradient(${rows.map((r, i) => {
          const pct = (r.value / t) * 100;
          const start = rows.slice(0, i).reduce((a, s) => a + (s.value / t) * 100, 0);
          return `${r.color} ${start}% ${start + pct}%`;
        }).join(', ')})`
      }}>
        <div className="donut-center">
          <strong>{total}</strong>
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

function Bars({ rows, max, color, valueFmt }) {
  rows = rows || [];
  if (!rows.length) return <p className="chart-empty">Nenhum dado</p>;
  return (
    <div className="bar-chart-h">
      {rows.map((r, i) => (
        <div key={i} className="bar-row">
          <span className="bar-label" title={r.label}>{r.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(r.value / max) * 100}%`, background: color[i % color.length] }} />
          </div>
          <span className="bar-value bar-value-wide">{valueFmt ? valueFmt(r.value) : r.value}</span>
        </div>
      ))}
    </div>
  );
}

function VerticalBars({ rows, color, valueFmt }) {
  rows = rows || [];
  if (!rows.length) return <p className="chart-empty">Nenhum dado</p>;
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <div className="bar-chart-v">
      {rows.map((r, i) => (
        <div key={i} className="bar-col">
          <div className="bar-col-track">
            <div
              className="bar-col-fill"
              style={{ height: `${(r.value / max) * 100}%`, background: color[i % color.length] }}
              title={`${r.label}: ${valueFmt ? valueFmt(r.value) : r.value}`}
            />
          </div>
          <span className="bar-col-valor">{valueFmt ? valueFmt(r.value) : r.value}</span>
          <span className="bar-col-label" title={r.label}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

function AnoChart({ data, valueFmt }) {
  data = data || [];
  if (!data.length) return <p className="chart-empty">Nenhum dado</p>;
  const max = Math.max(1, ...data.map(a => a.value));
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
          fill="none" stroke={PALETTE[0]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />
        {data.map((a, i) => (
          <g key={i}>
            <circle cx={xOf(i)} cy={yOf(a.value)} r="4" fill="var(--color-surface)" stroke={PALETTE[0]} strokeWidth="2" />
            <text x={xOf(i)} y={142} textAnchor="middle" fontSize="11" fill="var(--color-text-muted)">{a.label}</text>
            <text x={xOf(i)} y={yOf(a.value) - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-text)">{valueFmt ? valueFmt(a.value) : a.value}</text>
          </g>
        ))}
        <line x1="30" y1="130" x2={width - 40} y2="130" stroke="var(--color-border)" strokeWidth="1" />
      </svg>
    </div>
  );
}

export default Dashboard;
