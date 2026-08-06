require('dotenv').config();

const bcrypt = require('bcryptjs');
const { User } = require('../src/models/index');

async function main() {
  const nome = process.env.ADMIN_NOME;
  const email = process.env.ADMIN_EMAIL;
  const senha = process.env.ADMIN_SENHA;

  if (!nome || !email || !senha) {
    console.error('Defina ADMIN_NOME, ADMIN_EMAIL e ADMIN_SENHA no Backend/.env');
    process.exit(1);
  }

  try {
    const [usuario, criado] = await User.findOrCreate({
      where: { email },
      defaults: {
        nome,
        senha: await bcrypt.hash(senha, 10),
        role: 'admin',
        ativo: true,
        deveTrocarSenha: false
      }
    });

    if (criado) {
      console.log(`Admin criado: ${usuario.email} (role=admin)`);
    } else {
      console.log(`E-mail já existente (${usuario.email}). Nenhuma alteração feita.`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Erro ao criar o admin:', err);
    process.exit(1);
  }
}

main();
