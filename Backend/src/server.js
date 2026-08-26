const app = require('./app');
const PORT = process.env.PORT || 3000;
const { sequelize } = require('./config/db');
const { sincronizarNotificacoes } = require('./services/notificacaoService');
const { verificarNovasEdicoesComTrava } = require('./services/rpiMonitorService');

// Cria tabelas faltantes (ex.: token_blacklist do BUG-006) sem dropar nada.
// Evita que um modelo novo quebre o boot ou deixe rotas autenticadas em 401
// por falta de tabela. Idempotente (force:false).
sequelize.sync({ force: false })
  .then(() => console.log('✅ Tabelas sincronizadas (sequelize.sync).'))
  .catch((err) => console.error('⚠️ Falha ao sincronizar tabelas:', err.message));

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