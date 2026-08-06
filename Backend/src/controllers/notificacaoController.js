const { Notificacao } = require('../models/index');

// GET /api/notificacoes
exports.listNotificacoes = async (req, res) => {
  try {
    const data = await Notificacao.findAll({
      where: { usuario_id: req.usuario.id },
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
      where: { usuario_id: req.usuario.id, lida: false }
    });
    res.json({ unreadCount });
  } catch (error) {
    console.error('Erro ao contar notificações:', error);
    res.status(500).json({ error: 'Erro ao contar notificações.' });
  }
};

async function buscarDoUsuario(id, usuarioId) {
  return Notificacao.findOne({
    where: { id, usuario_id: usuarioId }
  });
}

// PATCH /api/notificacoes/:id
exports.markNotificacaoLida = async (req, res) => {
  try {
    const notificacao = await buscarDoUsuario(req.params.id, req.usuario.id);
    if (!notificacao) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }
    const lida = req.body.lida === undefined ? true : Boolean(req.body.lida);
    await notificacao.update({ lida });
    res.json({ data: notificacao });
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificação.' });
  }
};

// DELETE /api/notificacoes/:id
exports.deleteNotificacao = async (req, res) => {
  try {
    const notificacao = await buscarDoUsuario(req.params.id, req.usuario.id);
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
    const [affected] = await Notificacao.update(
      { lida: true },
      { where: { usuario_id: req.usuario.id, lida: false } }
    );
    res.json({ ok: true, affected });
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações como lidas.' });
  }
};
