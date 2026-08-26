const request = require('supertest');
const app = require('../src/app');
const { getToken, TEST_EMAIL, TEST_SENHA } = require('./helpers/bootstrap');

describe('Auth API', () => {
  beforeAll(async () => {
    // Garante que o usuário de teste existe para o login válido.
    await getToken();
  });

  it('POST /api/auth/login com credenciais inválidas retorna 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@inova.uern.br', senha: 'senhaerrada' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/auth/login com usuário válido retorna 200 + token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, senha: TEST_SENHA });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });
});
