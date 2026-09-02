require('dotenv').config();

const bcrypt = require('bcryptjs');
const { User } = require('../src/models/index');

async function main() {
  const nome = process.env.ADMIN_NOME;
  const email = process.env.ADMIN_EMAIL;
  const senha = process.env.ADMIN_SENHA;
  const usernameRaw = process.env.ADMIN_USERNAME || process.env.ADMIN_USER || nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0,20) || 'admin';

  if (!nome || !email || !senha) {
    console.error('Defina ADMIN_NOME, ADMIN_EMAIL e ADMIN_SENHA no Backend/.env');
    process.exit(1);
  }

  const username = String(usernameRaw).toLowerCase().trim();
  if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
    console.error('ADMIN_USERNAME inválido (3-30 a-z0-9_.)');
    process.exit(1);
  }

  try {
    const [usuario, criado] = await User.findOrCreate({
      where: { email },
      defaults: {
        nome,
        username,
        senha: await bcrypt.hash(senha, 10),
        role: 'admin',
        ativo: true,
        deveTrocarSenha: false
      }
    });
    // Garante username para admin existente sem username
    if (!criado && !usuario.username) {
      usuario.username = username;
      await usuario.save();
      console.log(`Admin existente atualizado com username: ${username}`);
    }

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
