import { jsPDF } from 'jspdf';

const PALETTE = ['#93278F', '#FA0183', '#FA7F0C', '#009FDF', '#D9E021'];
const CHART_COLORS = PALETTE;
const PRIMARY = '#93278F';
const PRIMARY_DARK = '#5E1A5C';
const WHITE = '#FFFFFF';
const BG = '#FFFFFF';
const TEXT = '#1F2937';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

const TIPO_LABELS = {
  'patente de invencao': 'Patente de Invenção',
  'modelo de utilidade': 'Modelo de Utilidade',
  'marca': 'Marca',
  'programa de computador': 'Programa de Computador'
};
function tipoLabel(t) {
  if (!t) return t;
  return TIPO_LABELS[t] || String(t).replace(/\b\w/g, c => c.toUpperCase());
}
const TIPO_COLORS = {
  'patente de invencao': PALETTE[0],
  'modelo de utilidade': PALETTE[1],
  'marca': PALETTE[2],
  'programa de computador': PALETTE[3]
};
function tipoColor(t) {
  return TIPO_COLORS[t] || CHART_COLORS[String(t || '').length % CHART_COLORS.length];
}
const STATUS_LABELS = {
  'deferida': 'Deferida', 'registrada': 'Registrada', 'carta patente': 'Carta Patente',
  'indeferida': 'Indeferida', 'anulada': 'Anulada', 'arquivada': 'Arquivada', 'em analise': 'Em análise'
};
function statusLabel(s) {
  if (!s) return s;
  return STATUS_LABELS[s] || String(s).replace(/\b\w/g, c => c.toUpperCase());
}
const GENDER_META = {
  'masculino': { label: 'Masculino', color: PALETTE[0] },
  'feminino': { label: 'Feminino', color: PALETTE[1] },
  'nao_informado': { label: 'Não informado', color: PALETTE[3] }
};
function normalizeGender(g) {
  if (g == null || g === '' || g === '—') return 'nao_informado';
  const s = String(g).toLowerCase();
  if (s === 'm' || s === 'masculino') return 'masculino';
  if (s === 'f' || s === 'feminino') return 'feminino';
  if (s.includes('inform')) return 'nao_informado';
  return s;
}
function genderLabel(g) { return GENDER_META[normalizeGender(g)]?.label || 'Não informado'; }
function genderColor(g) { return GENDER_META[normalizeGender(g)]?.color || PALETTE[3]; }
const SUCESSO = ['deferida', 'registrada', 'carta patente'];

function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const int = parseInt(n, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}
function parseColor(c) {
  if (typeof c === 'string' && c.startsWith('rgb')) {
    const m = c.match(/\d+/g);
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  }
  return hexToRgb(c);
}
function applyFill(doc, c) { const [r, g, b] = parseColor(c); doc.setFillColor(r, g, b); }
function applyDraw(doc, c) { const [r, g, b] = parseColor(c); doc.setDrawColor(r, g, b); }
function applyText(doc, c) { const [r, g, b] = parseColor(c); doc.setTextColor(r, g, b); }
function mixRgb(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return [Math.round(A[0] + (B[0] - A[0]) * t), Math.round(A[1] + (B[1] - A[1]) * t), Math.round(A[2] + (B[2] - A[2]) * t)];
}
function mixColor(a, b, t) { const [r, g, b2] = mixRgb(a, b, t); return `rgb(${r},${g},${b2})`; }

async function loadImage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = dataUrl;
    });
    return { dataUrl, width: img.naturalWidth, height: img.naturalHeight };
  } catch (e) {
    return null;
  }
}

async function loadBahnschrift(doc) {
  try {
    const res = await fetch(`${process.env.PUBLIC_URL || ''}/fonts/Bahnschrift.ttf`);
    if (!res.ok) return false;
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    const base64 = String(dataUrl).split(',')[1];
    doc.addFileToVFS('Bahnschrift.ttf', base64);
    doc.addFont('Bahnschrift.ttf', 'Bahnschrift', 'normal');
    doc.addFont('Bahnschrift.ttf', 'Bahnschrift', 'bold');
    return true;
  } catch (e) {
    return false;
  }
}

function trunc(doc, str, maxW) {
  str = String(str == null ? '' : str);
  if (doc.getTextWidth(str) <= maxW) return str;
  while (str.length > 1 && doc.getTextWidth(str + '…') > maxW) str = str.slice(0, -1);
  return str + '…';
}

function fillWedge(doc, cx, cy, r, a0, a1, color) {
  const steps = Math.max(2, Math.ceil((a1 - a0) / (Math.PI / 48)));
  applyFill(doc, color);
  for (let i = 0; i < steps; i++) {
    const t0 = a0 + (a1 - a0) * i / steps;
    const t1 = a0 + (a1 - a0) * (i + 1) / steps;
    const x0 = cx + r * Math.cos(t0);
    const y0 = cy + r * Math.sin(t0);
    const x1 = cx + r * Math.cos(t1);
    const y1 = cy + r * Math.sin(t1);
    doc.triangle(cx, cy, x0, y0, x1, y1, 'F');
  }
}

function drawDonut(doc, x, y, w, h, rows, total) {
  if (!total || !rows || !rows.length) { applyText(doc, MUTED); doc.setFontSize(9); doc.text('Sem dados', x, y + 10); return; }
  const r = Math.min(h, w * 0.42) / 2;
  const cx = x + r + 6;
  const cy = y + h / 2;
  let a = -Math.PI / 2;
  rows.forEach(s => {
    const frac = s.value / total || 0;
    const a1 = a + frac * Math.PI * 2;
    fillWedge(doc, cx, cy, r, a, a1, s.color);
    a = a1;
  });
  applyFill(doc, WHITE); doc.circle(cx, cy, r * 0.55, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); applyText(doc, TEXT);
  doc.text(String(total), cx, cy - 4, { align: 'center', baseline: 'middle' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); applyText(doc, MUTED);
  doc.text('total', cx, cy + 10, { align: 'center', baseline: 'middle' });
  const lx = cx + r + 16;
  let ly = cy - (rows.length * 18) / 2;
  rows.forEach(s => {
    applyFill(doc, s.color); doc.circle(lx, ly + 6, 4, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); applyText(doc, TEXT);
    doc.text(trunc(doc, s.label, w - (lx - x) - 20), lx + 12, ly + 4, { baseline: 'top' });
    doc.setFontSize(8); applyText(doc, MUTED);
    const pct = Math.round((s.value / total) * 100);
    doc.text(`${s.value} (${pct}%)`, lx + 12, ly + 15, { baseline: 'top' });
    ly += 18;
  });
}

function drawBars(doc, x, y, w, h, rows, valueFmt) {
  if (!rows || !rows.length) { applyText(doc, MUTED); doc.setFontSize(9); doc.text('Sem dados', x, y + 10); return; }
  const max = Math.max(1, ...rows.map(r => r.value || 0));
  const n = rows.length;
  const rowH = Math.min(22, h / n);
  const labelW = Math.min(160, w * 0.4);
  const valW = 80;
  const trackX = x + labelW + 6;
  const trackW = w - labelW - valW - 14;
  rows.forEach((s, i) => {
    const yy = y + i * rowH + rowH / 2;
    applyText(doc, TEXT); doc.setFontSize(8.5);
    doc.text(trunc(doc, s.label, labelW), x, yy, { baseline: 'middle' });
    applyFill(doc, CHART_COLORS[i % CHART_COLORS.length]);
    doc.rect(trackX, yy - 4, Math.max(1, trackW * ((s.value || 0) / max)), 8, 'F');
    applyText(doc, TEXT); doc.setFontSize(8.5);
    doc.text(valueFmt ? valueFmt(s.value) : String(s.value || 0), trackX + trackW + 6, yy, { baseline: 'middle' });
  });
}

function drawVerticalBars(doc, x, y, w, h, rows, valueFmt) {
  if (!rows || !rows.length) { applyText(doc, MUTED); doc.setFontSize(9); doc.text('Sem dados', x, y + 10); return; }
  const max = Math.max(1, ...rows.map(r => r.value || 0));
  const n = rows.length;
  const gap = 10;
  const bw = Math.min(46, (w - gap * (n - 1)) / n);
  const totalW = n * bw + gap * (n - 1);
  const startX = x + (w - totalW) / 2;
  const baseY = y + h - 18;
  const topY = y + 6;
  rows.forEach((s, i) => {
    const bh = ((s.value || 0) / max) * (baseY - topY);
    const bx = startX + i * (bw + gap);
    applyFill(doc, CHART_COLORS[i % CHART_COLORS.length]);
    doc.rect(bx, baseY - bh, bw, bh, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); applyText(doc, TEXT);
    doc.text(valueFmt ? valueFmt(s.value) : String(s.value || 0), bx + bw / 2, baseY - bh - 4, { align: 'center', baseline: 'bottom' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); applyText(doc, MUTED);
    doc.text(trunc(doc, String(s.label), bw + gap), bx + bw / 2, baseY + 10, { align: 'center', baseline: 'top' });
  });
}

function drawAnoChart(doc, x, y, w, h, rows) {
  const anos = [...new Set((rows || []).map(r => r.ano))].sort();
  const data = anos.map(a => ({ label: String(a), value: (rows || []).filter(r => r.ano === a).reduce((s, r) => s + (r.value || 0), 0) }));
  drawVerticalBars(doc, x, y, w, h, data);
}

function drawHeatmap(doc, x, y, w, h, rows) {
  if (!rows || !rows.length) { applyText(doc, MUTED); doc.setFontSize(9); doc.text('Sem dados', x, y + 10); return; }
  const bonds = [...new Set(rows.map(r => r.bond || 'Sem vínculo'))];
  const genders = [...new Set(rows.map(r => r.gender || 'nao_informado'))];
  const max = Math.max(1, ...rows.map(r => r.value || 0));
  const labelW = 92;
  const headH = 16;
  const cw = (w - labelW) / bonds.length;
  const ch = (h - headH) / genders.length;
  const get = (g, b) => rows.find(r => (r.gender || 'nao_informado') === g && (r.bond || 'Sem vínculo') === b)?.value || 0;
  bonds.forEach((b, i) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); applyText(doc, MUTED);
    doc.text(trunc(doc, b, cw), x + labelW + i * cw + cw / 2, y + headH - 4, { align: 'center', baseline: 'bottom' });
  });
  genders.forEach((g, ri) => {
    applyText(doc, TEXT); doc.setFontSize(7.5);
    doc.text(genderLabel(g), x + 4, y + headH + ri * ch + ch / 2, { baseline: 'middle' });
    bonds.forEach((b, ci) => {
      const v = get(g, b);
      const cellY = y + headH + ri * ch;
      if (v) applyFill(doc, mixColor(genderColor(g), WHITE, 1 - v / max));
      else applyFill(doc, '#F3F4F6');
      doc.rect(x + labelW + ci * cw, cellY, cw - 1, ch - 1, 'F');
      if (v) {
        applyText(doc, (v / max) > 0.5 ? WHITE : TEXT);
        doc.setFontSize(8);
        doc.text(String(v), x + labelW + ci * cw + cw / 2, cellY + ch / 2, { align: 'center', baseline: 'middle' });
      }
    });
  });
}

function drawRanking(doc, x, y, w, h, rows) {
  if (!rows || !rows.length) { applyText(doc, MUTED); doc.setFontSize(9); doc.text('Sem dados', x, y + 10); return; }
  const max = Math.max(1, ...rows.map(r => r.value || 0));
  const n = rows.length;
  const rowH = Math.min(22, h / n);
  rows.forEach((s, i) => {
    const yy = y + i * rowH;
    applyFill(doc, CHART_COLORS[i % CHART_COLORS.length]); doc.circle(x + 8, yy + rowH / 2, 7, 'F');
    applyText(doc, WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(String(i + 1), x + 8, yy + rowH / 2, { align: 'center', baseline: 'middle' });
    applyText(doc, TEXT); doc.setFontSize(8.5);
    doc.text(trunc(doc, s.label, 140), x + 22, yy + rowH / 2, { baseline: 'middle' });
    const trackX = x + 22 + 152;
    const trackW = w - 22 - 152 - 64;
    applyFill(doc, CHART_COLORS[i % CHART_COLORS.length]);
    doc.rect(trackX, yy + rowH / 2 - 4, Math.max(1, trackW * ((s.value || 0) / max)), 8, 'F');
    applyText(doc, TEXT); doc.setFontSize(8.5);
    doc.text(`${s.value || 0} ${s.suffix || ''}`, trackX + trackW + 6, yy + rowH / 2, { baseline: 'middle' });
  });
}

function drawUpcoming(doc, x, y, w, h, rows, fmtDate, fmtBRL) {
  if (!rows || !rows.length) { applyText(doc, MUTED); doc.setFontSize(9); doc.text('Nenhum vencimento pendente', x, y + 10); return; }
  const cols = [0.34, 0.22, 0.24, 0.20];
  const colorMap = { vencido: '#DC2626', proximo: '#EA580C', emdia: '#16A34A' };
  let c = x;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); applyText(doc, MUTED);
  doc.text('Tipo', c, y, { baseline: 'top' }); c += w * cols[0];
  doc.text('Valor', c, y, { baseline: 'top' }); c += w * cols[1];
  doc.text('Vencimento', c, y, { baseline: 'top' }); c += w * cols[2];
  doc.text('Status', c, y, { baseline: 'top' });
  let ry = y + 16;
  rows.forEach(r => {
    const hoje = new Date();
    const venc = r.vencimento ? new Date(r.vencimento) : null;
    const dias = venc ? Math.round((venc - hoje) / 86400000) : null;
    const status = (dias !== null && dias < 0) ? 'vencido' : (dias !== null && dias <= 30) ? 'proximo' : 'emdia';
    let c2 = x;
    applyText(doc, TEXT); doc.setFontSize(8.5);
    doc.text(trunc(doc, String(r.tipo || ''), w * cols[0]), c2, ry, { baseline: 'top' }); c2 += w * cols[0];
    doc.text(trunc(doc, fmtBRL ? fmtBRL(r.valor) : String(r.valor || ''), w * cols[1]), c2, ry, { baseline: 'top' }); c2 += w * cols[1];
    doc.text(fmtDate ? fmtDate(r.vencimento) : String(r.vencimento || ''), c2, ry, { baseline: 'top' }); c2 += w * cols[2];
    applyText(doc, colorMap[status]);
    doc.text(status === 'vencido' ? 'Vencido' : status === 'proximo' ? 'Próximo' : 'Em dia', c2, ry, { baseline: 'top' });
    ry += 16;
  });
}

function drawSemaforo(doc, x, y, w, h, seg) {
  const total = seg.reduce((a, s) => a + (s.value || 0), 0) || 1;
  let cx = x;
  const barH = 18;
  seg.forEach(s => {
    const bw = ((s.value || 0) / total) * w;
    if (bw > 0) { applyFill(doc, s.color); doc.rect(cx, y, bw, barH, 'F'); cx += bw; }
  });
  let ly = y + barH + 8;
  seg.forEach(s => {
    applyFill(doc, s.color); doc.circle(x + 6, ly + 5, 4, 'F');
    applyText(doc, TEXT); doc.setFontSize(8.5);
    doc.text(`${s.label}: ${s.value || 0}`, x + 16, ly + 8, { baseline: 'top' });
    ly += 15;
  });
}

async function desenharCapa(doc, W, H, hl) {
  for (let yy = 0; yy < H; yy += 3) {
    doc.setFillColor(...mixRgb(PRIMARY, PRIMARY_DARK, yy / H));
    doc.rect(0, yy, W, 3, 'F');
  }
  const squares = [
    { x: W * 0.05, y: H * 0.06, s: 60, c: PALETTE[1] },
    { x: W * 0.85, y: H * 0.10, s: 44, c: PALETTE[2] },
    { x: W * 0.10, y: H * 0.80, s: 50, c: PALETTE[3] },
    { x: W * 0.88, y: H * 0.82, s: 70, c: PALETTE[0] },
    { x: W * 0.04, y: H * 0.45, s: 34, c: PALETTE[4] },
    { x: W * 0.92, y: H * 0.50, s: 40, c: PALETTE[1] },
    { x: W * 0.18, y: H * 0.18, s: 30, c: PALETTE[3] },
    { x: W * 0.78, y: H * 0.22, s: 36, c: PALETTE[4] }
  ];
  squares.forEach(s => {
    doc.setFillColor(...mixRgb(s.c, PRIMARY, 0.2));
    doc.roundedRect(s.x, s.y, s.s, s.s, 8, 8, 'F');
  });
  const gpi = await loadImage(`${process.env.PUBLIC_URL || ''}/imagens/Sistema-Logo.png`);
  if (gpi) {
    const tw = 170;
    const th = tw * gpi.height / gpi.width;
    doc.addImage(gpi.dataUrl, 'PNG', (W - tw) / 2, H * 0.30, tw, th);
  }
  doc.setFont(hl, 'bold'); doc.setFontSize(22); applyText(doc, WHITE);
  doc.text('Relatório de Propriedades Intelectuais', W / 2, H * 0.56, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, W / 2, H * 0.62, { align: 'center' });
  const ag = await loadImage(`${process.env.PUBLIC_URL || ''}/imagens/Inova-Rodape.png`);
  if (ag) {
    const tw = 150;
    const th = tw * ag.height / ag.width;
    doc.addImage(ag.dataUrl, 'PNG', (W - tw) / 2, H * 0.86, tw, th);
  }
}

export async function gerarRelatorioPDF(dados) {
  const {
    pi = {}, autores = {}, pagamentos = {}, cruzamentos = {},
    fmtBRL = v => v, fmtDias = v => v, fmtPct = v => v, fmtDate = v => v
  } = dados;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = M;
  let tabTitle = '';
  const hl = (await loadBahnschrift(doc).catch(() => false)) ? 'Bahnschrift' : 'helvetica';

  function drawTabHeader() {
    applyFill(doc, PRIMARY); doc.rect(0, 0, W, 40, 'F');
    doc.setFont(hl, 'bold'); doc.setFontSize(14); applyText(doc, WHITE);
    doc.text(tabTitle, M, 26, { baseline: 'middle' });
    y = 56;
  }
  function ensure(h) { if (y + h > H - M) { doc.addPage(); y = M + 50; drawTabHeader(); } }
  function novaPagina(titulo) { doc.addPage(); tabTitle = titulo; y = M + 50; drawTabHeader(); }
  function sectionTitle(t) {
    ensure(26);
    doc.setFont(hl, 'bold'); doc.setFontSize(12); applyText(doc, TEXT);
    doc.text(t, M, y, { baseline: 'top' });
    y += 22;
  }
  function drawKpis(items) {
    const gap = 10;
    const perRow = Math.min(5, items.length);
    const cardW = (W - 2 * M - gap * (perRow - 1)) / perRow;
    const cardH = 54;
    items.forEach((it, i) => {
      const col = i % perRow, rowi = Math.floor(i / perRow);
      const x = M + col * (cardW + gap);
      const yy = y + rowi * (cardH + gap);
      applyDraw(doc, BORDER); doc.setLineWidth(1); applyFill(doc, BG);
      doc.roundedRect(x, yy, cardW, cardH, 6, 6, 'FD');
      applyText(doc, MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      doc.text(trunc(doc, it.label, cardW - 16), x + 8, yy + 10, { baseline: 'top' });
      applyText(doc, PRIMARY); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text(it.value, x + 8, yy + 24, { baseline: 'top' });
      if (it.sub) { applyText(doc, MUTED); doc.setFontSize(7); doc.text(trunc(doc, it.sub, cardW - 16), x + 8, yy + 40, { baseline: 'top' }); }
    });
    y += Math.ceil(items.length / perRow) * (cardH + gap);
  }
  function chartCard(title, chartH, draw, text) {
    let textH = 0;
    if (text) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      textH = doc.splitTextToSize(text, W - 2 * M - 24).length * 12 + 10;
    }
    const cardH = chartH + textH + 40;
    ensure(cardH);
    const x = M, w = W - 2 * M, h = cardH;
    applyDraw(doc, BORDER); doc.setLineWidth(1); applyFill(doc, BG);
    doc.roundedRect(x, y, w, h, 6, 6, 'FD');
    doc.setFont(hl, 'bold'); doc.setFontSize(11); applyText(doc, TEXT);
    doc.text(title, x + 12, y + 16, { baseline: 'top' });
    applyDraw(doc, BORDER); doc.line(x + 12, y + 30, x + w - 12, y + 30);
    draw(doc, x + 12, y + 38, w - 24, chartH);
    if (text) {
      applyText(doc, MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      const lines = doc.splitTextToSize(text, w - 24);
      doc.text(lines, x + 12, y + 38 + chartH + 8, { baseline: 'top' });
    }
    y += h + 14;
  }

  const statusCount = l => (pi.porStatus || []).find(s => s.label === l)?.value || 0;
  const concedidas = ['deferida', 'registrada', 'carta patente'].reduce((a, s) => a + statusCount(s), 0);
  const emAndamento = statusCount('em analise');
  const indeferidas = ['indeferida', 'anulada', 'arquivada'].reduce((a, s) => a + statusCount(s), 0);
  const totalPI = pi.total || 1;
  const funil = [
    { label: 'Em análise', value: pi.funil?.emAnalise, color: PALETTE[2] },
    { label: 'Deferida', value: pi.funil?.deferida, color: PALETTE[3] },
    { label: 'Registrada / Carta', value: pi.funil?.registradaOuCarta, color: PALETTE[0] },
    { label: 'Indeferida / Anulada', value: pi.funil?.indeferidaOuAnulada, color: PALETTE[1] },
    { label: 'Arquivada', value: pi.funil?.arquivada, color: PALETTE[4] }
  ];
  const semaforo = pagamentos.semaforo || { vencidos: 0, emDia: 0, futuros: 0 };
  const invest = cruzamentos.investimentoPorStatus || [];
  const totalInvest = invest.reduce((a, s) => a + Number(s.value || 0), 0);
  const risco = invest.filter(s => !SUCESSO.includes(s.label)).reduce((a, s) => a + Number(s.value || 0), 0);
  const riscoPct = totalInvest ? Math.round(risco / totalInvest * 100) : 0;

  await desenharCapa(doc, W, H, hl);

  novaPagina('Visão Geral');
  sectionTitle('Indicadores gerais');
  drawKpis([
    { label: 'Total de PIs', value: String(pi.total || 0), sub: `${(pi.ativos || 0)} ativas` },
    { label: 'Autores', value: String(autores.total || 0) },
    { label: 'Valor total pago', value: fmtBRL(pagamentos.valorPago || 0) },
    { label: 'Valor pendente', value: fmtBRL(pagamentos.valorPendente || 0) },
    { label: 'Taxa de sucesso', value: fmtPct(pi.funil?.taxaSucesso), sub: `${(pi.funil?.comDesfecho || 0)} com desfecho` }
  ]);
  chartCard('Distribuição de resultados', 80, (d, x, yy, w, hh) => drawSemaforo(d, x, yy, w, hh, [
    { label: 'Concedidas', value: concedidas, color: PALETTE[3] },
    { label: 'Em andamento', value: emAndamento, color: PALETTE[2] },
    { label: 'Indeferidas', value: indeferidas, color: PALETTE[1] }
  ]), `Das ${pi.total || 0} PIs registradas, ${concedidas} foram concedidas (${Math.round(concedidas / totalPI * 100)}% do total), refletindo o resultado positivo do processo de propriedade intelectual. Outras ${emAndamento} seguem em andamento e ${indeferidas} foram indeferidas, anuladas ou arquivadas, o que aponta oportunidades de melhoria na qualidade dos depósitos.`);
  chartCard('Funil de status das PIs', 96, (d, x, yy, w, hh) => drawBars(d, x, yy, w, hh, funil), `O funil de status apresenta a trajetória das PIs desde o depósito até a concessão. A taxa de sucesso é de ${pi.funil?.taxaSucesso || 0}% e a de insucesso ${pi.funil?.taxaInsucesso || 0}%, considerando ${pi.funil?.comDesfecho || 0} PIs com desfecho conhecido. Entender essas etapas ajuda a identificar onde ocorrem as perdas.`);
  chartCard('PIs por tipo', 130, (d, x, yy, w, hh) => drawDonut(d, x, yy, w, hh, (pi.porTipo || []).map(s => ({ label: tipoLabel(s.label), value: s.value, color: tipoColor(s.label) })), pi.total || 0), 'As PIs dividem-se entre patente de invenção, modelo de utilidade, marca e programa de computador. Conhecer essa distribuição auxilia no planejamento de recursos e na priorização das áreas com maior retorno sobre a proteção.');

  novaPagina('Autores');
  sectionTitle('Indicadores de autores');
  drawKpis([
    { label: 'Total de autores', value: String(autores.total || 0) },
    { label: 'Com gênero informado', value: String((autores.porGenero || []).filter(g => normalizeGender(g.label) !== 'nao_informado').reduce((a, g) => a + g.value, 0)) },
    { label: 'Campi', value: String((autores.porCampus || []).length) },
    { label: 'Departamentos', value: String((autores.porDepartamento || []).length) }
  ]);
  chartCard('Distribuição por gênero', 130, (d, x, yy, w, hh) => drawDonut(d, x, yy, w, hh, (autores.porGenero || []).map(g => ({ label: genderLabel(g.label), value: g.value, color: genderColor(g.label) })), autores.total || 0), `A distribuição por gênero retrata a composição dos ${autores.total || 0} autores cadastrados. Equilibrar a participação de masculino, feminino e não informado é importante para políticas de inclusão e para garantir o preenchimento correto dos dados.`);
  chartCard('Autores por vínculo', 120, (d, x, yy, w, hh) => drawBars(d, x, yy, w, hh, autores.porVinculo || []), 'Os autores distribuem-se por vínculos (docente, discente, técnico e instituição). Essa visão apoia a identificação dos perfis mais produtivos e de eventuais gargalos de engajamento.');
  chartCard('Autores por campus', 130, (d, x, yy, w, hh) => drawBars(d, x, yy, w, hh, autores.porCampus || []), 'A presença dos autores nos campi mostra a capilaridade da inovação na instituição e orienta ações de capacitação regional.');
  chartCard('Ranking de autores mais produtivos', 140, (d, x, yy, w, hh) => drawRanking(d, x, yy, w, hh, (autores.topAutores || []).map(a => ({ label: a.name, value: a.pis, suffix: 'PIs' }))), 'O ranking destaca os autores com maior número de PIs vinculadas, útil para reconhecimento institucional e para identificar multiplicadores de propriedade intelectual.');

  novaPagina('PIs');
  sectionTitle('Indicadores de PIs');
  drawKpis([
    { label: 'Total de PIs', value: String(pi.total || 0), sub: `${(pi.ativos || 0)} ativas` },
    { label: 'Em processo', value: String(pi.emProcesso || 0) },
    { label: 'Pendentes (terminal)', value: String(pi.pendentes || 0) },
    { label: 'Tempo médio', value: fmtDias(pi.tempoMedioDias), sub: `custo médio ${fmtBRL(pi.custoMedioPorPI)}/PI` }
  ]);
  chartCard('Evolução temporal por tipo de PI', 130, (d, x, yy, w, hh) => drawAnoChart(d, x, yy, w, hh, pi.porAnoTipo || []), 'A série histórica por ano revela a evolução da quantidade de PIs depositadas e permite observar tendências de crescimento ou estagnação ao longo do tempo.');
  chartCard('PIs por tipo', 120, (d, x, yy, w, hh) => drawBars(d, x, yy, w, hh, (pi.porTipo || []).map(t => ({ label: tipoLabel(t.label), value: t.value }))), 'A distribuição por tipo de PI orienta a alocação de esforço de proteção conforme o perfil de cada invento.');
  chartCard('Funil de status detalhado', 96, (d, x, yy, w, hh) => drawBars(d, x, yy, w, hh, funil), 'O funil detalhado reforça as etapas críticas do processo e onde ocorrem as perdas por indeferimento, anulação ou arquivamento.');
  chartCard('PIs por titular / instituição', 130, (d, x, yy, w, hh) => drawBars(d, x, yy, w, hh, pi.porTitular || []), 'Agrupar PIs por titular ou instituição evidencia quem detém a propriedade e facilita o acompanhamento de transferências e cessões.');

  novaPagina('Financeiro');
  sectionTitle('Indicadores financeiros');
  drawKpis([
    { label: 'Valor pago', value: fmtBRL(pagamentos.valorPago || 0) },
    { label: 'Valor pendente', value: fmtBRL(pagamentos.valorPendente || 0) },
    { label: 'Custo médio / PI', value: fmtBRL(pi.custoMedioPorPI || 0), sub: `por sucesso ${fmtBRL(pi.custoPorSucesso || 0)}` },
    { label: 'Pagamentos vencidos', value: String(semaforo.vencidos || 0) },
    { label: 'A vencer (30 dias)', value: String(pagamentos.aVencer30 || 0) },
    { label: 'Total de pagamentos', value: String(pagamentos.total || 0) }
  ]);
  chartCard('Valor pago por ano', 130, (d, x, yy, w, hh) => drawVerticalBars(d, x, yy, w, hh, (pagamentos.porAnoPago || []).map(d2 => ({ label: String(d2.ano), value: d2.value })), fmtBRL), 'O valor pago por ano evidencia o esforço financeiro anual com proteção e pode ser comparado à evolução do número de PIs depositadas.');
  chartCard('Situação dos pagamentos', 130, (d, x, yy, w, hh) => drawDonut(d, x, yy, w, hh, [
    { label: 'Pagos', value: pagamentos.pago || 0, color: PALETTE[4] },
    { label: 'Em andamento', value: pagamentos.emAndamento || 0, color: PALETTE[0] },
    { label: 'Aguardando', value: pagamentos.aguardandoPrazo || 0, color: PALETTE[2] }
  ], pagamentos.total || 0), 'A situação dos pagamentos (pagos, em andamento e aguardando) indica a saúde do fluxo financeiro e o volume de pendências a tratar.');
  chartCard('Custo médio por tipo de PI', 120, (d, x, yy, w, hh) => drawVerticalBars(d, x, yy, w, hh, (pagamentos.custoMedioPorTipo || []).map(t => ({ label: tipoLabel(t.label), value: t.value })), fmtBRL), 'O custo médio por tipo de PI apoia o dimensionamento de orçamento e a análise de retorno por categoria.');
  const proximos = pagamentos.proximosVencimentos || [];
  const vencH = Math.max(100, 16 + proximos.length * 16 + 12);
  chartCard('Próximos vencimentos', vencH, (d, x, yy, w, hh) => drawUpcoming(d, x, yy, w, hh, proximos, fmtDate, fmtBRL), 'Os próximos vencimentos exigem atenção para evitar inadimplência e manter as proteções ativas; itens vencidos ou próximos de 30 dias são prioridade.');

  novaPagina('Cruzamentos');
  sectionTitle('Cruzamentos e risco');
  drawKpis([
    { label: 'Investimento total', value: fmtBRL(pi.totalInvestido || 0), sub: `custo médio ${fmtBRL(pi.custoMedioPorPI || 0)}/PI` },
    { label: 'Risco (não concedidas)', value: fmtBRL(risco), sub: `${riscoPct}% do investimento` },
    { label: 'Departamentos ativos', value: String((cruzamentos.produtividadePorDepartamento || []).length) },
    { label: 'Campi ativos', value: String((cruzamentos.produtividadePorCampus || []).length) }
  ]);
  chartCard('Investimento por status da PI', 96, (d, x, yy, w, hh) => drawBars(d, x, yy, w, hh, invest.map(s => ({ label: statusLabel(s.label), value: s.value })), fmtBRL), `O investimento por status da PI separa o valor já aplicado em PIs concedidas do risco financeiro em PIs ainda não concedidas (${fmtBRL(risco)}, ${riscoPct}% do investimento total).`);
  chartCard('Heatmap gênero × vínculo × PIs', 140, (d, x, yy, w, hh) => drawHeatmap(d, x, yy, w, hh, cruzamentos.generoVinculoPIs || []), 'O cruzamento gênero × vínculo × PIs revela padrões de atuação dos autores e pode orientar ações de fomento direcionadas a cada perfil.');
  chartCard('Produtividade por departamento (PIs)', 130, (d, x, yy, w, hh) => drawBars(d, x, yy, w, hh, cruzamentos.produtividadePorDepartamento || []), 'A produtividade por departamento indica os centros mais ativos em propriedade intelectual.');
  chartCard('Produtividade por campus (PIs)', 130, (d, x, yy, w, hh) => drawBars(d, x, yy, w, hh, cruzamentos.produtividadePorCampus || []), 'A produtividade por campus mostra a distribuição territorial da produção e onde há maior densidade de inventos.');
  chartCard('Custo médio por tipo de PI', 120, (d, x, yy, w, hh) => drawBars(d, x, yy, w, hh, (cruzamentos.custoMedioPorTipo || []).map(t => ({ label: tipoLabel(t.label), value: t.value })), fmtBRL), 'O custo médio por tipo de PI, na visão de cruzamento, reforça a análise de custo-benefício por categoria.');
  chartCard('Top 10 departamentos (autores)', 140, (d, x, yy, w, hh) => drawRanking(d, x, yy, w, hh, (autores.porDepartamento || []).slice(0, 10).map(d2 => ({ label: d2.label, value: d2.value, suffix: 'autores' }))), 'Os 10 departamentos com mais autores evidenciam onde está o maior capital humano voltado à inovação.');

  doc.save('relatorio-propriedades-intelectuais.pdf');
}
