const request = require('supertest');
const app = require('../src/app');
const { getToken } = require('./helpers/bootstrap');

describe('PI API', () => {
  let token;

  beforeAll(async () => {
    token = await getToken();
  });

  const criarPi = (protocolo) =>
    request(app)
      .post('/api/pi')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'marca',
        depositante: 'TESTE CI',
        protocolo,
        titulo: 'PI de Teste'
      });

  it('POST /api/pi cria PI válida (201) e a remove (200)', async () => {
    const protocolo = 'TEST-CI-PI-' + Date.now();
    let id;
    try {
      const res = await criarPi(protocolo);
      expect(res.statusCode).toBe(201);
      expect(res.body.data.id).toBeDefined();
      id = res.body.data.id;

      const get = await request(app)
        .get(`/api/pi/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(get.statusCode).toBe(200);
      expect(get.body.data.protocolo).toBe(protocolo);
    } finally {
      if (id) {
        const del = await request(app)
          .delete(`/api/pi/${id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(del.statusCode).toBe(200);
      }
    }
  });

  it('POST /api/pi sem tipo retorna 400', async () => {
    const res = await request(app)
      .post('/api/pi')
      .set('Authorization', `Bearer ${token}`)
      .send({ depositante: 'X', protocolo: 'TEST-CI-PI-' + Date.now() });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/pi sem token retorna 401', async () => {
    const res = await request(app)
      .post('/api/pi')
      .send({ tipo: 'marca', depositante: 'X', protocolo: 'TEST-CI-PI-' + Date.now() });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/pi lista paginada (200)', async () => {
    const res = await request(app)
      .get('/api/pi?limit=5&offset=0')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  it('GET /api/pi/:id inexistente retorna 404', async () => {
    const res = await request(app)
      .get('/api/pi/999999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});
