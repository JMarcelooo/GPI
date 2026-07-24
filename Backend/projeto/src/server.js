const app = require('./app');
const PORT = process.env.PORT || 3000;

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
  
  // Agora podemos listar as rotas (opcional)
  if (process.env.NODE_ENV !== 'production') {
    setTimeout(() => listRoutes(app), 100); // Pequeno delay para garantir
  }
});

module.exports = server;