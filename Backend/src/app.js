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

// Health check (público)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date() });
});

// Autenticação (login é público)
app.use('/api/auth', require('./routes/authRoutes'));

// Middleware de autenticação — protege todas as rotas /api restantes
const { autenticar } = require('./middlewares/authMiddleware');

// Rotas
app.use('/api/pi', autenticar, require('./routes/piRoutes'));
app.use('/api/autores', autenticar, require('./routes/autorRoutes'));
app.use('/api/rpi', autenticar, require('./routes/rpiRoutes'));
app.use('/api/pagamentos', autenticar, require('./routes/pagamentoRoutes'));
app.use('/api/notificacoes', autenticar, require('./routes/notificacaoRoutes'));
app.use('/api/stats', autenticar, require('./routes/statRoutes'));
app.use('/api/usuarios', require('./routes/userRoutes'));

// Middleware de erro
app.use((err, req, res, _next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno' });
});

// Testa a conexão com o banco (sem iniciar servidor — server.js faz isso)
sequelize.authenticate()
  .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
  .catch(err => console.error('Erro ao conectar com o banco de dados:', err));

module.exports = app;