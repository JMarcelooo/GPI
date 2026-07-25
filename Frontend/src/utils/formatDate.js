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
