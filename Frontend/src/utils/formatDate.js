export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
}

const STATUS_LABELS = {
  'em analise': 'Em análise',
  'indeferida': 'Indeferida',
  'anulada': 'Anulada',
  'arquivada': 'Arquivada',
  'deferida': 'Deferida',
  'registrada': 'Registrada',
  'carta patente': 'Carta Patente'
};

export function formatStatus(status) {
  return STATUS_LABELS[status] || status;
}

const TIPO_LABELS = {
  'patente de invencao': 'Patente de Invenção',
  'modelo de utilidade': 'Modelo de Utilidade',
  'marca': 'Marca',
  'programa de computador': 'Programa de Computador'
};

export function formatTipo(tipo) {
  return TIPO_LABELS[tipo] || tipo;
}

export const STATUS_PAGAMENTO = ['aguardando prazo', 'em andamento', 'pago'];

const PAGAMENTO_STATUS_LABELS = {
  'aguardando prazo': 'Aguardando prazo',
  'em andamento': 'Em andamento',
  'pago': 'Pago'
};

export function formatStatusPagamento(status) {
  return PAGAMENTO_STATUS_LABELS[status] || status || '-';
}

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayString() {
  return toDateString(new Date());
}

export function addDaysToDate(dateStr, days) {
  const base = dateStr ? new Date(dateStr.slice(0, 10) + 'T00:00:00') : new Date();
  base.setHours(0, 0, 0, 0);
  if (days && !isNaN(Number(days)) && Number(days) >= 1) {
    base.setDate(base.getDate() + Number(days));
  }
  return toDateString(base);
}

export function addDaysToToday(days) {
  return addDaysToDate('', days);
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  if (isNaN(due.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due - today) / 86400000);
}
