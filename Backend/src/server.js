const app = require('./app');
const PORT = process.env.PORT || 3000;
const sequelize = require('./config/db');
const { sincronizarNotificacoes } = require('./services/notificacaoService');
const { verificarNovasEdicoesComTrava } = require('./services/rpiMonitorService');

// Cria tabelas faltantes e adiciona colunas novas (ex.: username, password_tokens)
// sem dropar dados. Usa alter:true para adicionar colunas que não existem.
sequelize.sync({ alter: true })
  .then(() => console.log('✅ Tabelas sincronizadas (sequelize.sync alter:true).'))
  .catch((err) => console.error('⚠️ Falha ao sincronizar tabelas:', err.message));

// Fallback manual para garantir username em bancos antigos onde alter não pegou por constraint
sequelize.authenticate().then(async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "username" varchar(30) UNIQUE;
      ALTER TABLE "usuarios" ALTER COLUMN "senha" DROP NOT NULL;
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_usuarios_username') THEN
          ALTER TABLE "usuarios" ADD CONSTRAINT "uq_usuarios_username" UNIQUE ("username");
        END IF;
      END $$;
    `);
    // Backfill username para usuários antigos (gera a partir do nome)
    const { User } = require('./models');
    const semUsername = await User.findAll({ where: { username: null } });
    for (const u of semUsername) {
      const base = String(u.nome || 'user').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0,20) || 'user';
      let cand = base;
      let n = 0;
      while (await User.findOne({ where: { username: cand } })) {
        n += 1;
        cand = `${base}${n}`.slice(0,30);
        if (n>100) break;
      }
      u.username = cand;
      await u.save();
      console.log(`🔧 Username backfill: ${u.email} → ${cand}`);
    }
  } catch(e) {
    // ignora se já existe
  }
});

const INTERVALO_RPI_MS = 24 * 60 * 60 * 1000; // 1×/dia

// Verifica se saiu edição nova da RPI (INPI). Falhas só logam — nunca
// derrubam o servidor; a próxima execução tenta de novo.
async function checarRpi(motivo) {
  try {
    const resultado = await verificarNovasEdicoesComTrava();
    const processadas = (resultado.resultados || []).filter(r => r.status === 'processada');
    if (processadas.length > 0) {
      for (const r of processadas) {
        console.log(`📰 RPI ${r.edicao} processada: ${r.matches} PI(s), ${r.criadas.rpis} RPI(s) e ${r.criadas.notificacoes} notificação(ões).`);
      }
    } else if (resultado.status === 'pagina_indisponivel') {
      console.log(`Monitor RPI (${motivo}): página do INPI indisponível ou sem edições reconhecidas.`);
    }
  } catch (err) {
    console.error(`Monitor RPI (${motivo}) falhou (tentará novamente):`, err.message);
  }
}

// Função para listar rotas (só funciona APÓS o app.listen)
const listRoutes = (app) => {
  if (app._router) {
    console.log('🛣️ Rotas registradas:');
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach(handler => {
          const route = handler.route;
          route && console.log(`${Object.keys(route.methods).join(', ').toUpperCase()} ${route.path}`);
        });
      }
    });
  }
};

// Inicie o servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);

  // Gera as notificações iniciais a partir dos pagamentos
  sincronizarNotificacoes().catch(err => {
    console.error('Erro ao gerar notificações:', err);
  });

  // Monitor de publicações da RPI: checa no boot e depois 1×/dia.
  checarRpi('boot');
  setInterval(() => checarRpi('intervalo-diario'), INTERVALO_RPI_MS);

  // Agora podemos listar as rotas (opcional)
  if (process.env.NODE_ENV !== 'production') {
    setTimeout(() => listRoutes(app), 100); // Pequeno delay para garantir
  }
});

module.exports = server;