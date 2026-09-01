const { Op } = require('sequelize');
const AdmZip = require('adm-zip');
const { XMLParser } = require('fast-xml-parser');
const sequelize = require('../config/db');
const { PI, RPI, Notificacao, RpiEdicao, Historico } = require('../models/index');

const URL_PAGINA_RPI = 'https://revistas.inpi.gov.br/rpi/';
const URL_ZIP_PATENTES = (numero) => `https://revistas.inpi.gov.br/txt/P${numero}.zip`;
const URL_ZIP_PROGRAMAS = (numero) => `https://revistas.inpi.gov.br/txt/PC${numero}.zip`;
const URL_ZIP_MARCAS = (numero) => `https://revistas.inpi.gov.br/txt/RM${numero}.zip`;
const TIMEOUT_MS = 60 * 1000;

// Status que ainda podem receber despachos publicados na revista.
const STATUS_ATIVOS = ['em analise', 'deferida', 'registrada', 'carta patente'];

let emExecucao = false;

// Remove espaços, hífens e pontos para tolerar variações de formato
// ("BR 10 2024 001244-14", "BR10202400124414" e "BR5120260009359" casam).
function normalizarProtocolo(protocolo) {
  const s = String(protocolo || '').trim().replace(/[\s.\-/\\]/g, '').toUpperCase();
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

// O servidor do INPI responde 503 esporadicamente e, às vezes, encerra a
// conexão durante o handshake TLS (ECONNRESET). Tenta várias vezes com backoff
// crescente antes de desistir (a execução seguinte também tentará).
const TENTATIVAS_FETCH = 5;
const ESPERA_BASE_MS = 4 * 1000;

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
      // Backoff progressivo: 4s, 8s, 16s, 32s.
      const espera = ESPERA_BASE_MS * 2 ** (tentativa - 1);
      await new Promise((r) => setTimeout(r, espera));
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

// Baixa um ZIP da RPI (patentes ou programas) e devolve o XML embutido.
async function baixarXmlDaSecao(url, numero) {
  const res = await fetchComRetry(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GPI-UERN/1.0)' }
  });
  const buffer = Buffer.from(await res.arrayBuffer());

  // O INPI às vezes responde 200 com HTML (ex.: seção ainda não publicada)
  // em vez de ZIP — detecta pelo magic bytes PK (ZIP) antes de tentar abrir.
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    const preview = buffer.slice(0, 200).toString('utf8').replace(/\s+/g, ' ').trim();
    throw new Error(`Resposta não é ZIP para ${url} da RPI ${numero} (preview: ${preview.slice(0, 120)})`);
  }

  const zip = new AdmZip(buffer);
  const entradaXml = zip.getEntries().find((e) => e.entryName.toLowerCase().endsWith('.xml'));
  if (!entradaXml) throw new Error(`ZIP ${url} da RPI ${numero} não contém XML`);
  return zip.readAsText(entradaXml.entryName, 'utf8');
}

// Parseia o XML de uma seção (Patentes: <processo-patente>; Programas de
// Computador: <processo-programa>) e devolve os eventos por protocolo:
// Map<protocolo normalizado, [{ codigo, titulo }]>
function parsearEventosXml(xml, numero) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml);
  let despachos = doc && doc.revista ? doc.revista.despacho : null;
  if (!despachos) throw new Error(`XML da RPI ${numero} sem <revista>/<despacho>`);
  if (!Array.isArray(despachos)) despachos = [despachos];

  const eventos = new Map();
  for (const d of despachos) {
    let processos = d['processo-patente'] || d['processo-programa'];
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

// Parseia o XML da seção de Marcas (RM{n}.zip), cuja estrutura difere das
// demais: <revista><processo numero="905934687"><despachos><despacho
// codigo="IPAS161" nome="…"/> — número e despachos em atributos, e um mesmo
// processo pode ter vários despachos.
function parsearEventosXmlMarcas(xml, numero) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml);
  let processos = doc && doc.revista ? doc.revista.processo : null;
  if (!processos) throw new Error(`XML de Marcas da RPI ${numero} sem <revista>/<processo>`);
  if (!Array.isArray(processos)) processos = [processos];

  const eventos = new Map();
  for (const proc of processos) {
    const chave = normalizarProtocolo(proc['@_numero']);
    if (!chave) continue;

    let despachos = proc.despachos ? proc.despachos.despacho : null;
    if (!despachos) continue;
    if (!Array.isArray(despachos)) despachos = [despachos];

    for (const d of despachos) {
      if (!eventos.has(chave)) eventos.set(chave, []);
      eventos.get(chave).push({
        codigo: d['@_codigo'] != null ? String(d['@_codigo']) : null,
        titulo: d['@_nome'] != null ? String(d['@_nome']) : ''
      });
    }
  }
  return eventos;
}

// Baixa as seções monitoradas da edição (Patentes + Programas de Computador +
// Marcas) e mescla os eventos por protocolo. Seções indisponíveis
// (503, HTML no lugar de ZIP, etc.) são ignoradas com aviso — a edição
// ainda é processada com as seções que funcionaram (ex.: 2904 só tem
// Patentes no momento da publicação).
async function extrairEventosDaEdicao(numero) {
  const secoes = [
    { url: URL_ZIP_PATENTES(numero), parsear: parsearEventosXml },
    { url: URL_ZIP_PROGRAMAS(numero), parsear: parsearEventosXml },
    { url: URL_ZIP_MARCAS(numero), parsear: parsearEventosXmlMarcas }
  ];

  const eventos = new Map();
  let algumaSecaoOk = false;
  const erros = [];
  for (const { url, parsear } of secoes) {
    try {
      const xml = await baixarXmlDaSecao(url, numero);
      for (const [chave, evs] of parsear(xml, numero)) {
        if (!eventos.has(chave)) eventos.set(chave, []);
        eventos.get(chave).push(...evs);
      }
      algumaSecaoOk = true;
    } catch (e) {
      const nome = url.split('/').pop();
      erros.push(`${nome}: ${e.message}`);
      console.warn(`Seção ${nome} da RPI ${numero} indisponível — ignorada: ${e.message}`);
    }
  }
  if (!algumaSecaoOk) {
    throw new Error(`Nenhuma seção TXT disponível para RPI ${numero}: ${erros.join('; ')}`);
  }
  if (erros.length > 0) {
    console.warn(`RPI ${numero} processada parcialmente (${erros.length} seção(ões) ignorada(s)): ${erros.join('; ')}`);
  }
  return eventos;
}

function truncar(texto, max) {
  const s = String(texto || '').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

async function registrarLogSistema({ acao, descricao, detalhes }) {
  try {
    await Historico.create({
      pi_id: null,
      usuario_id: null,
      usuario_nome: 'Sistema',
      tipo: 'rpi',
      acao,
      descricao: truncar(descricao, 500),
      detalhes: { origem: 'monitor_rpi', ...detalhes },
    });
  } catch (e) {
    console.error('Falha ao registrar log de monitoramento da RPI no histórico:', e.message);
  }
}

// codigo_evento é FLOAT: "100.1" → 100.1; códigos de marca como "IPAS161"
// viram 161 (primeiro número do código); sem número → 0.
function converterCodigo(codigo) {
  if (codigo == null) return 0;
  const m = /\d+(?:\.\d+)?/.exec(String(codigo));
  if (!m) return 0;
  const n = parseFloat(m[0]);
  return Number.isNaN(n) ? 0 : n;
}

// Processa UMA edição já baixada/parseada: cruza com as PIs ativas e, para
// cada match, grava (numa única transação) registro RPI, evento no histórico
// e uma notificação compartilhada (leitura global). A edição só é marcada
// como processada dentro da mesma transação — qualquer falha faz rollback
// e a execução seguinte tenta de novo.
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
              codigo_evento: converterCodigo(ev.codigo),
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

        notificacoesParaCriar.push({
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

    // Dedupe contra notificações já existentes desta edição antes do insert
    // (o índice único parcial também protege, mas assim evitamos erro).
    if (notificacoesParaCriar.length > 0) {
      const existentes = await Notificacao.findAll({
        where: { tipo: 'rpi', rpi_numero: edicao.numero },
        attributes: ['pi_id', 'mensagem'],
        transaction: t
      });
      const chavesNotif = new Set(existentes.map((n) => `${n.pi_id}|${n.mensagem}`));
      const novas = notificacoesParaCriar.filter(
        (n) => !chavesNotif.has(`${n.pi_id}|${n.mensagem}`)
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
// Registra cada execução (sucesso ou falha) no histórico com autor "Sistema"
// para aparecer na aba Eventos dos Logs do sistema.
async function verificarNovasEdicoesComTrava() {
  if (emExecucao) return { status: 'ja_em_execucao' };
  emExecucao = true;
  try {
    const resultado = await verificarNovasEdicoes();

    if (resultado.status === 'pagina_indisponivel') {
      await registrarLogSistema({
        acao: 'falha',
        descricao: 'Monitoramento da RPI falhou — página do INPI indisponível ou sem edições reconhecidas',
        detalhes: { evento: 'verificacao_falha', motivo: 'pagina_indisponivel', verificadas: resultado.verificadas || 0 },
      });
    } else if (resultado.status === 'nada_a_fazer') {
      await registrarLogSistema({
        acao: 'atualizacao',
        descricao: `Monitoramento da RPI executado com sucesso — ${resultado.verificadas} edição(ões) verificada(s), nenhuma nova para processar`,
        detalhes: { evento: 'verificacao_sucesso', verificadas: resultado.verificadas, processadas: 0 },
      });
    } else if (resultado.status === 'ok') {
      const processadas = resultado.resultados || [];
      const totalRpis = processadas.reduce((s, p) => s + (p.criadas?.rpis || 0), 0);
      const totalNotifs = processadas.reduce((s, p) => s + (p.criadas?.notificacoes || 0), 0);
      const totalMatches = processadas.reduce((s, p) => s + (p.matches || 0), 0);
      const edicoesStr = processadas.map((p) => p.edicao).join(', ');
      await registrarLogSistema({
        acao: 'criacao',
        descricao: `Monitoramento da RPI executado com sucesso — ${processadas.length} edição(ões) processada(s) [${edicoesStr}] — ${totalMatches} PI(s) com despacho, ${totalRpis} RPI(s) e ${totalNotifs} notificação(ões) criada(s)`,
        detalhes: {
          evento: 'verificacao_sucesso',
          verificadas: resultado.verificadas,
          processadas: processadas.length,
          rpis: totalRpis,
          notificacoes: totalNotifs,
          matches: totalMatches,
          edicoes: processadas.map((p) => p.edicao),
        },
      });
    }

    return resultado;
  } catch (err) {
    const msg = err?.message ? truncar(err.message, 200) : 'erro desconhecido';
    const rede =
      err?.cause?.code === 'ECONNRESET' ||
      err?.cause?.code === 'ETIMEDOUT' ||
      err?.cause?.code === 'ECONNREFUSED' ||
      String(err.message || '').includes('fetch failed');
    const descricao = rede
      ? `Monitoramento da RPI falhou — não foi possível contactar o INPI (${msg}). Tentará novamente na próxima verificação`
      : `Monitoramento da RPI falhou — ${msg}`;
    await registrarLogSistema({
      acao: 'falha',
      descricao,
      detalhes: { evento: 'verificacao_falha', erro: msg, rede: !!rede },
    });
    throw err;
  } finally {
    emExecucao = false;
  }
}

module.exports = { verificarNovasEdicoes, verificarNovasEdicoesComTrava };
