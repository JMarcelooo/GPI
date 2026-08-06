const { Historico } = require('../models');

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

async function registrarHistorico({ pi_id, tipo, acao, descricao, detalhes }) {
  if (!pi_id) return;
  await Historico.create({ pi_id, tipo, acao, descricao, detalhes: detalhes || null });
}

module.exports = {
  registrarHistorico,
  camposAlterados,
  descricaoCamposAlterados,
  LABELS,
  formatValue
};
