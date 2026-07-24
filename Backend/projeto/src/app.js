const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rotas
app.use('/api/pi', require('./routes/piRoutes'));
app.use('/api/autores', require('./routes/autorRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date() });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno' });
});

// Testa a conexão com o banco (sem iniciar servidor — server.js faz isso)
sequelize.authenticate()
  .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
  .catch(err => console.error('Erro ao conectar com o banco de dados:', err));

module.exports = app;