// Remove tags HTML de uma string para prevenir Stored XSS.
// Preserva o texto dentro das tags.
function stripHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '');
}

// Sanitiza um objeto, aplicando stripHtml em todos os valores string.
function stripHtmlFields(obj, fields) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = { ...obj };
  for (const field of fields) {
    if (sanitized[field] !== undefined && sanitized[field] !== null) {
      sanitized[field] = stripHtml(sanitized[field]);
    }
  }
  return sanitized;
}

module.exports = { stripHtml, stripHtmlFields };
