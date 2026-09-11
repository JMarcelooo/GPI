const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/db');

const app = express();

app.disable('x-powered-by');

app.set('trust proxy', 1);

const FRONTEND_URLS = (process.env.FRONTEND_URL
  || 'http://localhost:3001,http://127.0.0.1:3001')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);


app.use(cors({
  origin(origin, callback) {
    if (!origin || FRONTEND_URLS.includes(origin)) {
      callback(null, origin || FRONTEND_URLS[0]);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
  }
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origem não permitida pelo CORS.' });
  }
  next(err);
});

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
const { autenticar, exigirAdmin } = require('./middlewares/authMiddleware');


// Rotas
app.use('/api/pi', autenticar, require('./routes/piRoutes'));
app.use('/api/autores', autenticar, require('./routes/autorRoutes'));
app.use('/api/rpi', autenticar, require('./routes/rpiRoutes'));
app.use('/api/pagamentos', autenticar, require('./routes/pagamentoRoutes'));
app.use('/api/notificacoes', autenticar, require('./routes/notificacaoRoutes'));
// Histórico global: o próprio router exige admin (além do autenticar global).
app.use('/api/historico', autenticar, require('./routes/historicoRoutes'));
app.use('/api/stats', autenticar, require('./routes/statRoutes'));
app.use('/api/usuarios', autenticar, require('./routes/userRoutes'));
// Monitor de RPI: o próprio router exige admin (além do autenticar global).
app.use('/api/rpi-monitor', autenticar, exigirAdmin, require('./routes/rpiMonitorRoutes'));

// 404 para rotas inexistentes — retorna JSON em vez de HTML do Express
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

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