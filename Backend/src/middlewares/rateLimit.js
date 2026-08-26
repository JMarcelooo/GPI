const rateLimit = require('express-rate-limit');

// Protege /api/auth/login contra força bruta e credential stuffing.
// Conta APENAS tentativas FALHAS (resposta com status >= 400) por IP + e-mail,
// de modo que um usuário legítimo que acerte a senha não é penalizado.
// Após `max` falhas dentro da janela, o par (IP, e-mail) é bloqueado com 429
// (lockout) até a janela expirar.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // Desativa a validação padrão do express-rate-limit: ela dispara
  // ERR_ERL_KEY_GEN_IPV6 sempre que o keyGenerator referencia req.ip, mesmo
  // quando o IP já está sanitizado (sem ':').
  validate: false,
  keyGenerator: (req) => {
    const ip = (req.ip || req.socket.remoteAddress || 'desconhecido').replace(/:/g, '.');
    const email = req.body && req.body.email
      ? String(req.body.email).toLowerCase().trim()
      : 'desconhecido';
    return `${ip}_${email}`;
  },
  statusCode: 429,
  message: {
    error: 'Muitas tentativas de login falhas. Esta conta foi temporariamente bloqueada. Tente novamente mais tarde.',
    codigo: 'LOGIN_BLOQUEADO'
  }
});

module.exports = { loginLimiter };
