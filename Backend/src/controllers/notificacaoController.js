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

// PATCH /api/notificacoes/:id
exports.markNotificacaoLida = async (req, res) => {
  try {
    const notificacao = await Notificacao.findByPk(req.params.id);
    if (!notificacao) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }
    const lida = req.body.lida === undefined ? true : Boolean(req.body.lida);

    if (lida) {
      // Registra quem marcou como lida (visível para todos).
      const usuario = await User.findByPk(req.usuario.id, { attributes: ['id', 'nome'] });
      await notificacao.update({
        lida: true,
        lida_por_id: usuario ? usuario.id : null,
        lida_por_nome: usuario ? usuario.nome : null,
        lida_em: new Date()
      });
    } else {
      // Voltou a não lida → limpa a atribuição.
      await notificacao.update({ lida: false, lida_por_id: null, lida_por_nome: null, lida_em: null });
    }

    res.json({ data: notificacao });
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificação.' });
  }
};

// DELETE /api/notificacoes/:id
exports.deleteNotificacao = async (req, res) => {
  try {
    const notificacao = await Notificacao.findByPk(req.params.id);
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
    const usuario = await User.findByPk(req.usuario.id, { attributes: ['id', 'nome'] });
    const [affected] = await Notificacao.update(
      {
        lida: true,
        lida_por_id: usuario ? usuario.id : null,
        lida_por_nome: usuario ? usuario.nome : null,
        lida_em: new Date()
      },
      { where: { lida: false } }
    );
    res.json({ ok: true, affected });
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações como lidas.' });
  }
};
