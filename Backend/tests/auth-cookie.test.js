const request = require('supertest');
const app = require('../src/app');
const { getToken, TEST_EMAIL, TEST_SENHA } = require('./helpers/bootstrap');

// BUG-006: token em cookie httpOnly + revogação no logout.
describe('Auth cookie httpOnly + blacklist (BUG-006)', () => {
  beforeAll(async () => {
    // Garante que o usuário de teste existe para o login válido.
    await getToken();
  });

  it('login define cookie httpOnly e requisição seguinte autentica via cookie', async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, senha: TEST_SENHA });

    expect(loginRes.statusCode).toBe(200);
    const setCookie = loginRes.headers['set-cookie'].join(';');
    expect(setCookie).toMatch(/gpi_token=/);
    expect(setCookie).toMatch(/HttpOnly/i);

    const piRes = await agent.get('/api/pi?limit=1');
    expect(piRes.statusCode).toBe(200);
  });

  it('logout revoga o jti: cookie reaproveitado e Bearer do cookie são rejeitados (401)', async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, senha: TEST_SENHA });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeUndefined();

    // Extrai o token JWT do cookie httpOnly set-cookie
    const setCookie = loginRes.headers['set-cookie'].join(';');
    const cookieMatch = setCookie.match(/gpi_token=([^;]+)/);
    expect(cookieMatch).toBeTruthy();
    const rawToken = cookieMatch[1];

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.statusCode).toBe(200);

    // Cookie original reaproveitado manualmente (jti revogado) -> 401
    const cookie = loginRes.headers['set-cookie'].join('; ');
    const reuse = await request(app)
      .get('/api/pi?limit=1')
      .set('Cookie', cookie);
    expect(reuse.statusCode).toBe(401);

    // Bearer capturado do cookie -> 401 após logout
    const bearer = await request(app)
      .get('/api/pi?limit=1')
      .set('Authorization', `Bearer ${rawToken}`);
    expect(bearer.statusCode).toBe(401);
  });
});
