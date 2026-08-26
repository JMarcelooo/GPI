const request = require('supertest');
const app = require('../src/app');
const { getToken } = require('./helpers/bootstrap');

describe('Autor API', () => {
  let token;

  beforeAll(async () => {
    token = await getToken();
  });

  const criarAutor = (email) =>
    request(app)
      .post('/api/autores')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Autor CI',
        email,
        bond: 'Docente',
        department: 'Departamento',
        campus: 'Campus',
        university: 'UERN',
        gender: 'Masculino',
        phone: '99999999999'
      });

  it('POST /api/autores cria autor válido (201) e o remove (200)', async () => {
    const email = 'autor-ci-' + Date.now() + '@uern.br';
    let id;
    try {
      const res = await criarAutor(email);
      expect(res.statusCode).toBe(201);
      expect(res.body.data.id).toBeDefined();
      id = res.body.data.id;

      const get = await request(app)
        .get(`/api/autores/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(get.statusCode).toBe(200);
    } finally {
      if (id) {
        const del = await request(app)
          .delete(`/api/autores/${id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(del.statusCode).toBe(200);
      }
    }
  });

  it('POST /api/autores sem name retorna 400', async () => {
    const res = await request(app)
      .post('/api/autores')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'semnome@uern.br' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/autores sem token retorna 401', async () => {
    const res = await request(app)
      .post('/api/autores')
      .send({ name: 'X', email: 'x@uern.br' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/autores lista paginada (200)', async () => {
    const res = await request(app)
      .get('/api/autores?limit=5&offset=0')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
