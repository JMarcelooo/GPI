// testSequelize.js
const sequelize = require('./src/config/db'); // Importe o sequelize do arquivo de conexão
const { DataTypes } = require('sequelize');

// Teste de Conexão
sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados bem-sucedida!');
  })
  .catch((err) => {
    console.error('Erro ao conectar com o banco de dados:', err);
  });

// Definição de um modelo simples para teste
const TestModel = sequelize.define('TestModel', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

// Criar uma tabela no banco de dados
sequelize.sync({ force: true })  // Use { force: true } para criar as tabelas do zero
  .then(() => {
    console.log('Tabelas sincronizadas!');
    // Teste de criação de dados no modelo
    return TestModel.create({
      nome: 'Teste',
      descricao: 'Teste de ORM',
    });
  })
  .then((result) => {
    console.log('Novo registro criado:', result);
  })
  .catch((err) => {
    console.error('Erro ao sincronizar as tabelas:', err);
  });
