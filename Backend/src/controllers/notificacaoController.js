const { Notificacao } = require('../models/index');
const { sincronizarNotificacoes } = require('../services/notificacaoService');

// GET /api/notificacoes
exports.listNotificacoes = async (req, res) => {
  try {
    await sincronizarNotificacoes();
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
    await sincronizarNotificacoes();
    const unreadCount = await Notificacao.count({ where: { lida: false } });
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
    await notificacao.update({ lida });
    res.json({ data: notificacao });
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificação.' });
  }
};

// POST /api/notificacoes/marcar-todas-lidas
exports.markAllNotificacoesLidas = async (req, res) => {
  try {
    const [affected] = await Notificacao.update(
      { lida: true },
      { where: { lida: false } }
    );
    res.json({ ok: true, affected });
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações como lidas.' });
  }
};
