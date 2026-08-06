const { Historico, User } = require('../models');

const LABELS = {
  tipo: 'Tipo',
  titulo: 'Título',
  depositante: 'Depositante',
  parceiro: 'Parceiro',
  titular: 'Titular',
  status: 'Status',
  protocolo: 'Protocolo',
  data_entrada: 'Data de entrada',
  ano: 'Ano',
  termo_cessao: 'Termo de cessão',
  data: 'Data',
  codigo_evento: 'Código do evento',
  descricao_do_evento: 'Descrição do evento',
  tipo_de_pagamento: 'Tipo de pagamento',
  data_de_vencimento: 'Data de vencimento',
  data_informada: 'Data informada',
  valor: 'Valor',
  prazo_dias: 'Prazo (dias)',
  processo_sei: 'Processo SEI',
  observacao: 'Observação'
};

function formatValue(value) {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || '-';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

// Compara o registro anterior com os dados novos e retorna os campos alterados
function camposAlterados(anterior, novo) {
  const alterados = [];
  Object.keys(novo).forEach(campo => {
    if (campo === 'autores') return;
    if (novo[campo] === undefined) return;
    const antes = anterior ? anterior[campo] : undefined;
    const depois = novo[campo];
    if (JSON.stringify(antes ?? null) !== JSON.stringify(depois ?? null)) {
      alterados.push({ campo, antes, depois });
    }
  });
  return alterados;
}

function descricaoCamposAlterados(alterados) {
  return alterados
    .map(a => `${LABELS[a.campo] || a.campo}: ${formatValue(a.antes)} → ${formatValue(a.depois)}`)
    .join('; ');
}

// Registra um evento no histórico da PI, gravando qual usuário o fez.
// O nome é desnormalizado (usuario_nome) para o registro sobreviver à exclusão
// do usuário e evitar um join na listagem.
async function registrarHistorico({ pi_id, tipo, acao, descricao, detalhes, usuario }) {
  if (!pi_id) return;

  let usuarioId = usuario && usuario.id ? usuario.id : null;
  let usuarioNome = usuario && usuario.nome ? usuario.nome : null;

  // req.usuario (do JWT) só tem id/role → busca o nome no banco.
  if (usuarioId && !usuarioNome) {
    const u = await User.findByPk(usuarioId, { attributes: ['id', 'nome'] }).catch(() => null);
    if (u) {
      usuarioId = u.id;
      usuarioNome = u.nome;
    }
  }

  await Historico.create({
    pi_id,
    usuario_id: usuarioId,
    usuario_nome: usuarioNome,
    tipo,
    acao,
    descricao,
    detalhes: detalhes || null
  });
}

module.exports = {
  registrarHistorico,
  camposAlterados,
  descricaoCamposAlterados,
  LABELS,
  formatValue
};
