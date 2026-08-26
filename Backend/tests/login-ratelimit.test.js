const request = require('supertest');
const app = require('../src/app');

// BUG-007: /api/auth/login sem throttling/lockout.
// O limiter (src/middlewares/rateLimit.js) conta apenas falhas por IP+e-mail
// e bloqueia com 429 após 5 tentativas na janela de 15 min.
describe('Login rate limit / lockout (BUG-007)', () => {
  it('bloqueia com 429 após 5 tentativas falhas no mesmo e-mail+IP', async () => {
    const email = 'lockout-alvo-' + Date.now() + '@inova.uern.br';
    let bloqueado = false;
    for (let i = 1; i <= 6; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, senha: 'senhaerrada' });
      if (res.statusCode === 429) {
        bloqueado = true;
        expect(res.body.codigo).toBe('LOGIN_BLOQUEADO');
        break;
      }
      expect(res.statusCode).toBe(401);
    }
    expect(bloqueado).toBe(true);
  });

  it('resposta 429 inclui cabeçalho Retry-After', async () => {
    const email = 'lockout-header-' + Date.now() + '@inova.uern.br';
    let res429 = null;
    for (let i = 1; i <= 6; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, senha: 'x' });
      if (res.statusCode === 429) {
        res429 = res;
        break;
      }
    }
    expect(res429).not.toBeNull();
    expect(res429.headers).toHaveProperty('retry-after');
  });
});
