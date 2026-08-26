require('dotenv').config();

const sequelize = require('../../src/config/db');
const bcrypt = require('bcryptjs');
const User = require('../../src/models/User');
const { assinarToken } = require('../../src/middlewares/authMiddleware');

const TEST_EMAIL = 'teste-ci@inova.uern.br';
const TEST_SENHA = 'Teste@1234';

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: false });
});

let cachedToken = null;

async function getToken() {
  if (cachedToken) return cachedToken;
  const senha = await bcrypt.hash(TEST_SENHA, 10);
  const [user] = await User.findOrCreate({
    where: { email: TEST_EMAIL },
    defaults: {
      nome: 'Teste CI',
      email: TEST_EMAIL,
      senha,
      role: 'admin',
      ativo: true,
      deveTrocarSenha: false
    }
  });
  cachedToken = assinarToken(user);
  return cachedToken;
}

afterAll(async () => {
  await User.destroy({ where: { email: TEST_EMAIL } });
  await sequelize.close();
});

module.exports = { getToken, TEST_EMAIL, TEST_SENHA };
