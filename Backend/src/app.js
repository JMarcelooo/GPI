const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/db');

const app = express();

// Confia no proxy reverso (nginx) para req.secure / X-Forwarded-* / req.ip
// corretos — necessário para o cookie httpOnly ficar Secure atrás de HTTPS
// e para o rate-limit usar o IP real do cliente.
app.set('trust proxy', true);

// Origem(s) permitida(s) via FRONTEND_URL no .env (separadas por vírgula).
// Em dev (sem a variável) usamos o endereço do CRA (porta 3001). O cors com
// array de origens define 'Access-Control-Allow-Origin' explícito (não o
// curinga '*'), o que é obrigatório quando credentials:true (cookie httpOnly
// do BUG-006). Sem origin explícito, o reflexo de req.headers.origin falha e
// o navegador bloqueia com 'No Access-Control-Allow-Origin header'.
const FRONTEND_URLS = (process.env.FRONTEND_URL
  || 'http://localhost:3001,http://127.0.0.1:3001')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

// BUG-001: Usa função callback ao invés de array para o CORS não vazar
// headers de CORS (incluindo credentials) para origens não autorizadas.
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

// Tratamento de erro de parsing de JSON (corpo malformado) -> 400.
// Em Express 5, express.json() repassa o SyntaxError (type 'entity.parse.failed')
// para o next, que cairia no handler global e responderia 500.
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
const { autenticar } = require('./middlewares/authMiddleware');

// Rotas
app.use('/api/pi', autenticar, require('./routes/piRoutes'));
app.use('/api/autores', autenticar, require('./routes/autorRoutes'));
app.use('/api/rpi', autenticar, require('./routes/rpiRoutes'));
app.use('/api/pagamentos', autenticar, require('./routes/pagamentoRoutes'));
app.use('/api/notificacoes', autenticar, require('./routes/notificacaoRoutes'));
// Histórico global: o próprio router exige admin (além do autenticar global).
app.use('/api/historico', autenticar, require('./routes/historicoRoutes'));
app.use('/api/stats', autenticar, require('./routes/statRoutes'));
app.use('/api/usuarios', require('./routes/userRoutes'));
// Monitor de RPI: o próprio router exige admin (além do autenticar global).
const { exigirAdmin } = require('./middlewares/authMiddleware');
app.use('/api/rpi-monitor', autenticar, exigirAdmin, require('./routes/rpiMonitorRoutes'));

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