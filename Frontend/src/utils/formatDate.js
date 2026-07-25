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
