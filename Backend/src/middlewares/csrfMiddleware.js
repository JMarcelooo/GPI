const crypto = require('crypto');

const CSRF_COOKIE = 'gpi_csrf';
const CSRF_HEADER = 'x-csrf-token';
const CSRF_MAX_AGE = 8 * 60 * 60 * 1000; // 8h (mesmo do JWT)

function csrfCookieOptions(req) {
  const isHttps = req && (req.secure || req.headers['x-forwarded-proto'] === 'https');
  return {
    httpOnly: false,       // frontend precisa ler via document.cookie
    sameSite: 'lax',       // suficiente — o valor é transmitido via header customizado
    secure: isHttps,
    maxAge: CSRF_MAX_AGE,
    path: '/'
  };
}

// Gera token CSRF e seta cookie legível + req.csrfToken
function gerarCsrf(req, res, next) {
  const token = crypto.randomUUID();
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions(req));
  req.csrfToken = token;
  next();
}

// Verifica que X-CSRF-Token header == gpi_csrf cookie (double-submit pattern)
function verificarCsrf(req, res, next) {
  const cookieToken = req.cookies && req.cookies[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Token CSRF inválido.' });
  }
  next();
}

module.exports = { gerarCsrf, verificarCsrf, CSRF_COOKIE, csrfCookieOptions };
