const { Sequelize } = require('sequelize');
const initModels = require('./src/models/init-models');

require('dotenv').config(); // carrega as variáveis do .env

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const models = initModels(sequelize);
const Autor = models.autor;

async function testarCriacaoDeAutor() {
  try {
    // Tenta autenticar
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados bem-sucedida!');

    // Cria um novo autor (simulando o req.body)
    const novoAutor = await Autor.create({
      nome: "Joao",
      email: "jao@teste.com",
      vinculo: "Pesquisador",
      departamento: "Engenharia",
      campus: "Centro",
      universidade: "UF Teste"
    });

    console.log('🎉 Autor criado com sucesso:', novoAutor.toJSON());
  } catch (error) {
    console.error('❌ Erro ao testar criação de autor:', error.message);
  } finally {
    await sequelize.close(); // fecha a conexão depois do teste
  }
}

testarCriacaoDeAutor();
