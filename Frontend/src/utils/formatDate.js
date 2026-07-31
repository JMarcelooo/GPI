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
