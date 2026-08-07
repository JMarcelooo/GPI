const { Notificacao, User } = require('../models/index');

// GET /api/notificacoes
exports.listNotificacoes = async (req, res) => {
  try {
    const data = await Notificacao.findAll({
      order: [['lida', 'ASC'], ['createdAt', 'DESC']]
    });
    const unreadCount = data.filter(n => !n.lida).length;
    res.json({ count: data.length, unreadCount, data });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ error: 'Erro ao listar notificações.' });
  }
};

// GET /api/notificacoes/count
exports.countNotificacoes = async (req, res) => {
  try {
    const unreadCount = await Notificacao.count({
      where: { lida: false }
    });
    res.json({ unreadCount });
  } catch (error) {
    console.error('Erro ao contar notificações:', error);
    res.status(500).json({ error: 'Erro ao contar notificações.' });
  }
};

async function buscarNotificacao(id) {
  return Notificacao.findByPk(id);
}

// Busca o nome do usuário autenticado para atribuir "quem leu".
async function nomeDoUsuario(usuario) {
  if (!usuario || !usuario.id) return null;
  const u = await User.findByPk(usuario.id, { attributes: ['id', 'nome'] }).catch(() => null);
  return u && u.nome ? u.nome : null;
}

// PATCH /api/notificacoes/:id
exports.markNotificacaoLida = async (req, res) => {
  try {
    const notificacao = await buscarNotificacao(req.params.id);
    if (!notificacao) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }
    const lida = req.body.lida === undefined ? true : Boolean(req.body.lida);
    const atualizacoes = { lida };

    if (lida) {
      const nome = await nomeDoUsuario(req.usuario);
      atualizacoes.lida_por_id = req.usuario && req.usuario.id ? req.usuario.id : null;
      atualizacoes.lida_por_nome = nome;
      atualizacoes.lida_em = new Date();
    } else {
      atualizacoes.lida_por_id = null;
      atualizacoes.lida_por_nome = null;
      atualizacoes.lida_em = null;
    }

    await notificacao.update(atualizacoes);
    res.json({ data: notificacao });
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificação.' });
  }
};

// DELETE /api/notificacoes/:id
exports.deleteNotificacao = async (req, res) => {
  try {
    const notificacao = await buscarNotificacao(req.params.id);
    if (!notificacao) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }
    await notificacao.destroy();
    res.json({ message: 'Notificação removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover notificação:', error);
    res.status(500).json({ error: 'Erro ao remover notificação.' });
  }
};

// POST /api/notificacoes/marcar-todas-lidas
exports.markAllNotificacoesLidas = async (req, res) => {
  try {
    const agora = new Date();
    const nome = await nomeDoUsuario(req.usuario);
    const usuarioId = req.usuario && req.usuario.id ? req.usuario.id : null;
    const [affected] = await Notificacao.update(
      { lida: true, lida_por_id: usuarioId, lida_por_nome: nome, lida_em: agora },
      { where: { lida: false } }
    );
    res.json({ ok: true, affected });
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações como lidas.' });
  }
};