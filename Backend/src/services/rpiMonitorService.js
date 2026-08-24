const { Op } = require('sequelize');
const AdmZip = require('adm-zip');
const { XMLParser } = require('fast-xml-parser');
const sequelize = require('../config/db');
const { PI, RPI, Notificacao, User, RpiEdicao, Historico } = require('../models/index');

const URL_PAGINA_RPI = 'https://revistas.inpi.gov.br/rpi/';
const URL_ZIP_PATENTES = (numero) => `https://revistas.inpi.gov.br/txt/P${numero}.zip`;
const TIMEOUT_MS = 60 * 1000;

// Status que ainda podem receber despachos publicados na revista.
const STATUS_ATIVOS = ['em analise', 'deferida', 'registrada', 'carta patente'];

let emExecucao = false;

function normalizarProtocolo(protocolo) {
  const s = String(protocolo || '').trim().replace(/\s+/g, '').toUpperCase();
  return s || null;
}

// Aceita "dd/mm/aaaa" e "aaaa-mm-dd" (a página da RPI já usou os dois).
function converterData(dataStr) {
  const s = String(dataStr || '').trim();
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return s;
  return null;
}

async function fetchComTimeout(url, opcoes = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opcoes, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// O servidor do INPI responde 503 esporadicamente; tenta algumas vezes
// com espera antes de desistir (a execução seguinte também tentará).
const TENTATIVAS_FETCH = 3;
const ESPERA_ENTRE_TENTATIVAS_MS = 5 * 1000;

async function fetchComRetry(url, opcoes = {}) {
  let ultimoErro;
  for (let tentativa = 1; tentativa <= TENTATIVAS_FETCH; tentativa += 1) {
    try {
      const res = await fetchComTimeout(url, opcoes);
      if (res.ok) return res;
      ultimoErro = new Error(`${url} respondeu ${res.status}`);
    } catch (err) {
      ultimoErro = err;
    }
    if (tentativa < TENTATIVAS_FETCH) {
      await new Promise((r) => setTimeout(r, ESPERA_ENTRE_TENTATIVAS_MS));
    }
  }
  throw ultimoErro;
}

// Lê a página da RPI e devolve as edições listadas, da mais recente para a
// mais antiga: [{ numero, dataPublicacao }]. Cada linha da tabela principal
// é "<tr ...><td>2902</td><td>2026-08-18</td>" (ou data "dd/mm/aaaa").
async function listarEdicoesRecentes() {
  const res = await fetchComRetry(URL_PAGINA_RPI, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GPI-UERN/1.0)' }
  });
  if (!res.ok) throw new Error(`Página da RPI respondeu ${res.status}`);
  const html = await res.text();

  const edicoes = [];
  const vistos = new Set();
  const re = /<tr[^>]*>\s*<td>\s*(\d{3,5})\s*<\/td>\s*<td>\s*([\d/.:-]+?)\s*<\/td>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const numero = parseInt(m[1], 10);
    const dataPublicacao = converterData(m[2]);
    if (numero >= 2200 && dataPublicacao && !vistos.has(numero)) {
      vistos.add(numero);
      edicoes.push({ numero, dataPublicacao });
    }
  }
  return edicoes.sort((a, b) => b.numero - a.numero);
}

// Baixa o ZIP de patentes da edição e extrai os eventos por protocolo:
// Map<protocolo normalizado, [{ codigo, titulo }]>
async function extrairEventosDaEdicao(numero) {
  const res = await fetchComRetry(URL_ZIP_PATENTES(numero), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GPI-UERN/1.0)' }
  });
  const buffer = Buffer.from(await res.arrayBuffer());

  const zip = new AdmZip(buffer);
  const entradaXml = zip.getEntries().find((e) => e.entryName.toLowerCase().endsWith('.xml'));
  if (!entradaXml) throw new Error(`ZIP da RPI ${numero} não contém XML`);
  const xml = zip.readAsText(entradaXml.entryName, 'utf8');

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml);
  let despachos = doc && doc.revista ? doc.revista.despacho : null;
  if (!despachos) throw new Error(`XML da RPI ${numero} sem <revista>/<despacho>`);
  if (!Array.isArray(despachos)) despachos = [despachos];

  const eventos = new Map();
  for (const d of despachos) {
    let processos = d['processo-patente'];
    if (!processos) continue;
    if (!Array.isArray(processos)) processos = [processos];

    const codigo = d.codigo != null ? String(d.codigo) : null;
    const titulo = d.titulo != null ? String(d.titulo) : '';

    for (const p of processos) {
      const numeroProcesso = p.numero && (p.numero['#text'] ?? p.numero);
      const chave = normalizarProtocolo(numeroProcesso);
      if (!chave) continue;
      if (!eventos.has(chave)) eventos.set(chave, []);
      eventos.get(chave).push({ codigo, titulo });
    }
  }
  return eventos;
}

function truncar(texto, max) {
  const s = String(texto || '').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// Processa UMA edição já baixada/parseada: cruza com as PIs ativas e, para
// cada match, grava (numa única transação) registro RPI, evento no histórico
// e uma notificação por usuário ativo. A edição só é marcada como processada
// dentro da mesma transação — qualquer falha faz rollback e a execução
// seguinte tenta de novo.
async function processarEdicao(edicao, eventosPorProtocolo) {
  const dataEdicao = converterData(edicao.dataPublicacao);

  const pis = await PI.findAll({
    where: { status: { [Op.in]: STATUS_ATIVOS }, protocolo: { [Op.ne]: '' } },
    attributes: ['id', 'protocolo', 'titulo']
  });

  const matches = [];
  for (const pi of pis) {
    const chave = normalizarProtocolo(pi.protocolo);
    const eventos = chave ? eventosPorProtocolo.get(chave) : null;
    if (eventos && eventos.length > 0) matches.push({ pi, eventos });
  }

  if (matches.length === 0) {
    await RpiEdicao.create({ numero: edicao.numero, data_publicacao: dataEdicao });
    return { status: 'sem_matches', edicao: edicao.numero };
  }

  const usuarios = await User.findAll({ where: { ativo: true }, attributes: ['id'] });

  // Idempotência das RPIs: se uma execução anterior morreu no meio desta
  // edição, evita duplicar registros com mesmo PI + data + código.
  const piIds = matches.map((m) => m.pi.id);
  const rpisExistentes = await RPI.findAll({
    where: { pi_id: { [Op.in]: piIds }, ...(dataEdicao ? { data: dataEdicao } : {}) },
    attributes: ['pi_id', 'codigo_evento', 'descricao_do_evento']
  });
  const chavesExistentes = new Set(
    rpisExistentes.map((r) => `${r.pi_id}|${r.codigo_evento}|${r.descricao_do_evento}`)
  );

  let rpisCriadas = 0;
  let notificacoesCriadas = 0;

  await sequelize.transaction(async (t) => {
    const notificacoesParaCriar = [];

    for (const { pi, eventos } of matches) {
      for (const ev of eventos) {
        const descricaoEvento = truncar(ev.titulo, 255);
        const chaveNova = `${pi.id}|${ev.codigo}|${descricaoEvento}`;

        if (!chavesExistentes.has(chaveNova)) {
          await RPI.create(
            {
              pi_id: pi.id,
              data: dataEdicao,
              codigo_evento: ev.codigo != null && !Number.isNaN(parseFloat(ev.codigo))
                ? parseFloat(ev.codigo)
                : 0,
              descricao_do_evento: descricaoEvento
            },
            { transaction: t }
          );
          rpisCriadas += 1;
          chavesExistentes.add(chaveNova);

          await Historico.create(
            {
              pi_id: pi.id,
              // Sem usuário logado (ação automatizada); creditada como "Sistema".
              usuario_nome: 'Sistema',
              tipo: 'rpi',
              acao: 'criacao',
              descricao: truncar(
                `RPI registrada automaticamente — Revista nº ${edicao.numero}${dataEdicao ? ` de ${dataEdicao}` : ''} — Despacho ${ev.codigo}: ${descricaoEvento}`,
                500
              ),
              detalhes: { origem: 'monitor_rpi', edicao: edicao.numero, despacho: ev }
            },
            { transaction: t }
          );
        }

        for (const u of usuarios) {
          notificacoesParaCriar.push({
            usuario_id: u.id,
            pi_id: pi.id,
            rpi_numero: edicao.numero,
            tipo: 'rpi',
            mensagem: truncar(
              `A PI "${pi.titulo || pi.protocolo}" apareceu na RPI nº ${edicao.numero} — Despacho ${ev.codigo}: ${descricaoEvento}`,
              255
            ),
            lida: false
          });
        }
      }
    }

    // Dedupe contra notificações já existentes desta edição antes do insert
    // (o índice único parcial também protege, mas assim evitamos erro).
    if (notificacoesParaCriar.length > 0) {
      const existentes = await Notificacao.findAll({
        where: { tipo: 'rpi', rpi_numero: edicao.numero },
        attributes: ['usuario_id', 'pi_id', 'mensagem'],
        transaction: t
      });
      const chavesNotif = new Set(existentes.map((n) => `${n.usuario_id}|${n.pi_id}|${n.mensagem}`));
      const novas = notificacoesParaCriar.filter(
        (n) => !chavesNotif.has(`${n.usuario_id}|${n.pi_id}|${n.mensagem}`)
      );
      if (novas.length > 0) {
        await Notificacao.bulkCreate(novas, { transaction: t });
        notificacoesCriadas = novas.length;
      }
    }

    await RpiEdicao.create(
      { numero: edicao.numero, data_publicacao: dataEdicao },
      { transaction: t }
    );
  });

  return {
    status: 'processada',
    edicao: edicao.numero,
    data: edicao.dataPublicacao,
    matches: matches.length,
    criadas: { rpis: rpisCriadas, notificacoes: notificacoesCriadas }
  };
}

// Verifica as edições listadas na página da RPI e processa (da mais recente
// para a mais antiga) as que ainda não foram processadas. Edições antigas
// perdidas durante períodos sem execução são recuperadas dentro da janela
// visível na página (~7 semanas).
async function verificarNovasEdicoes() {
  const edicoes = await listarEdicoesRecentes();
  if (edicoes.length === 0) return { status: 'pagina_indisponivel' };

  const resultados = [];
  for (const edicao of edicoes) {
    const jaProcessada = await RpiEdicao.findByPk(edicao.numero);
    if (jaProcessada) continue;

    const eventosPorProtocolo = await extrairEventosDaEdicao(edicao.numero);
    resultados.push(await processarEdicao(edicao, eventosPorProtocolo));
  }

  return {
    status: resultados.length > 0 ? 'ok' : 'nada_a_fazer',
    verificadas: edicoes.length,
    resultados
  };
}

// Versão com trava anti-sobreposição: se uma verificação ainda está
// rodando (ex.: INPI lento), as chamadas seguintes são ignoradas.
async function verificarNovasEdicoesComTrava() {
  if (emExecucao) return { status: 'ja_em_execucao' };
  emExecucao = true;
  try {
    return await verificarNovasEdicoes();
  } finally {
    emExecucao = false;
  }
}

module.exports = { verificarNovasEdicoes, verificarNovasEdicoesComTrava };
