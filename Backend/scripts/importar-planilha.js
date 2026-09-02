require('dotenv').config({ path: './.env' });
const fs = require('fs');
const path = require('path');
const { PI, autor: Autor, Pagamento, RPI, User } = require('../src/models/index');
const sequelize = require('../src/config/db');
const { registrarHistorico } = require('../src/services/historicoService');

// Caminho da planilha configurável via PLANILHA_PATH no .env; sem ele,
// usa o CSV na raiz do repositório.
const CSV_PATH = process.env.PLANILHA_PATH
  ? path.resolve(process.env.PLANILHA_PATH)
  : path.join(__dirname, '..', '..', 'Cópia de ACOMPANHAMENTO DE PIs - para Marcelo - GESTÃO DE PIs.csv');

const TIPOS_PI_MAP = {
  'PATENTE DE INVENÇÃO': 'patente de invencao',
  'MODELO DE UTILIDADE': 'modelo de utilidade',
  'MARCA': 'marca',
  'PROGRAMA DE COMPUTADOR': 'programa de computador'
};

const STATUS_MAP = {
  'Arquivada': 'arquivada',
  'Carta Patente': 'carta patente',
  'Registrada': 'registrada',
  'Indeferida': 'indeferida',
  'Em análise': 'em analise',
  'Anulada': 'anulada',
  'Deferida': 'deferida'
};

function parseCSV(content) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field.trim()); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && content[i + 1] === '\n') i++;
      row.push(field.trim()); field = '';
      if (row.some(c => c !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field.trim());
    if (row.some(c => c !== '')) rows.push(row);
  }
  return rows;
}

function parseDateBR(str) {
  if (!str) return null;
  const m = String(str).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return null;
  let ano = parseInt(m[3], 10);
  if (ano < 100) ano += ano < 70 ? 2000 : 1900;
  return `${ano}-${String(parseInt(m[2], 10)).padStart(2, '0')}-${String(parseInt(m[1], 10)).padStart(2, '0')}`;
}

function parseCurrency(str) {
  if (!str) return 0;
  const num = String(str).replace(/[a-zA-Z$ ()]/g, '').replace(/\./g, '').replace(',', '.');
  const v = parseFloat(num);
  return isNaN(v) ? 0 : v;
}

function parseRPI(desc) {
  // "19/02/2013 - 2.10 Entrada do Pedido..." → { data, codigo, descricao }
  const m = String(desc).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*-\s*(\d+(?:\.\d+)?)?\s*(.*)$/);
  if (!m) return null;
  let ano = parseInt(m[3], 10);
  if (ano < 100) ano += ano < 70 ? 2000 : 1900;
  return {
    data: `${ano}-${String(parseInt(m[2], 10)).padStart(2, '0')}-${String(parseInt(m[1], 10)).padStart(2, '0')}`,
    codigo: m[4] ? parseFloat(m[4]) : null,
    descricao: m[5] ? m[5].trim() : desc
  };
}

function splitAutores(str) {
  if (!str) return [];
  return String(str)
    .split(/[\/,;]/)
    .map(s => s.trim())
    .filter(s => s && !/Departamento/i.test(s));
}

function nomeLimpo(nome) {
  return nome.length > 50 ? nome.slice(0, 50) : nome;
}

function trunca(str, len) {
  return str && str.length > len ? str.slice(0, len) : str;
}

async function main() {
  await sequelize.authenticate();
  console.log('Conectado ao banco.');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`Arquivo não encontrado: ${CSV_PATH}`);
    process.exit(1);
  }

  const usuarios = await User.findAll({ where: { ativo: true }, order: [['id', 'ASC']] });
  if (usuarios.length === 0) {
    console.error('Nenhum usuário cadastrado. Rode scripts/seed-admin.js antes.');
    process.exit(1);
  }
  const usuario = usuarios[0];

  const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf-8'));
  console.log(`Linhas lidas: ${rows.length}`);

  // ---- 1. Autores ----
  const autorCache = {};
  const autoresExistentes = await Autor.findAll();
  for (const a of autoresExistentes) autorCache[a.name] = a;

  const nomesAutores = new Set();
  for (const r of rows) {
    const tipo = (r[1] || '').toUpperCase().trim();
    if (TIPOS_PI_MAP[tipo]) {
      for (const n of splitAutores(r[11] || '')) nomesAutores.add(n);
    }
  }
  console.log(`Autores únicos na planilha: ${nomesAutores.size}`);

  let autoresCriados = 0;
  for (const nome of nomesAutores) {
    if (!autorCache[nome]) {
      autorCache[nome] = await Autor.create({ name: nomeLimpo(nome), gender: 'Nao informado' });
      autoresCriados++;
    }
  }
  console.log(`Autores criados: ${autoresCriados}`);

  // ---- 2. PIs ----
  const todasPis = await PI.findAll();
  const protocolosExistentes = new Set(todasPis.map(p => p.protocolo));

  let pisImportadas = 0, pagamentosImportados = 0, rpisImportadas = 0, puladas = 0;

  let i = 0;
  while (i < rows.length) {
    const r = rows[i];
    const tipo = (r[1] || '').toUpperCase().trim();

    if (TIPOS_PI_MAP[tipo]) {
      const protocolo = (r[7] || '').trim();
      if (!protocolo || protocolosExistentes.has(protocolo)) {
        console.log(`PI pulada (sem protocolo ou já existente): ${protocolo || r[2]}`);
        puladas++;
        i++;
        continue;
      }

      const dataEntrada = parseDateBR(r[8]);
      const parceiro = (r[4] || '').trim();
      const pi = await PI.create({
        tipo: TIPOS_PI_MAP[tipo],
        titulo: trunca((r[2] || '').trim(), 200) || null,
        depositante: trunca((r[3] || '').trim(), 100) || 'UERN',
        parceiro: ((parceiro === '-' ? null : parceiro) || null) && trunca(parceiro, 100),
        titular: (r[5] || '').split('/').map(s => s.trim()).filter(Boolean),
        status: STATUS_MAP[(r[6] || '').trim()] || 'em analise',
        protocolo: trunca(protocolo, 50),
        data_entrada: dataEntrada,
        ano: parseInt(r[9], 10) || null,
        termo_cessao: ((r[10] || '').trim().toUpperCase() === 'SIM')
      });
      protocolosExistentes.add(protocolo);
      pisImportadas++;

      // autores
      const nomes = splitAutores(r[11] || '');
      const autoresPI = nomes.map(nome => autorCache[nome]).filter(Boolean);
      if (autoresPI.length) await pi.addAutores(autoresPI);

      await registrarHistorico({
        pi_id: pi.id,
        tipo: 'pi',
        acao: 'criacao',
        descricao: `PI importada da planilha — protocolo ${pi.protocolo}`,
        usuario
      });

      // ---- Bloco seguinte: pagamentos + RPIs até próxima PI ou cabeçalho TIPO ----
      let j = i + 1;
      while (j < rows.length) {
        const pr = rows[j];
        const ptipo = (pr[1] || '').toUpperCase().trim();
        if (TIPOS_PI_MAP[ptipo] || ptipo === 'TIPO') break;

        // Linha de pagamento: col1 = tipo_de_pagamento (não cabeçalho) com data na col2
        const pagNome = (pr[1] || '').trim();
        const dataPgto = parseDateBR(pr[2]);
        if (pagNome && ptipo !== 'PAGAMENTOS' && ptipo !== 'TIPO') {
          const valor = parseCurrency(pr[3]);
          const vencimento = dataPgto || dataEntrada;
          await Pagamento.create({
            pi_id: pi.id,
            tipo_de_pagamento: trunca(pagNome, 50),
            data_de_vencimento: vencimento,
            data_informada: dataPgto,
            valor,
            status: 'pago',
            processo_sei: trunca((pr[7] || '').trim(), 100) || null,
            observacao: trunca((pr[4] || '').trim(), 255) || null
          });
          pagamentosImportados++;
        }

        // RPI (coluna 11) em qualquer linha do bloco
        const rpiDesc = (pr[11] || '').trim();
        const rpiInfo = parseRPI(rpiDesc);
        if (rpiInfo) {
          await RPI.create({
            data: rpiInfo.data,
            pi_id: pi.id,
            codigo_evento: rpiInfo.codigo !== null ? rpiInfo.codigo : 0,
            descricao_do_evento: rpiInfo.descricao ? rpiInfo.descricao.slice(0, 255) : null
          });
          rpisImportadas++;
        }
        j++;
      }
      i = j;
    } else {
      i++;
    }
  }

  // ---- 2b. Extração de telefone/email dos autores (passada separada) ----
  console.log('Extraindo telefone e email dos autores...');
  let autoresAtualizados = 0;
  const autorCacheRefresh = {};
  const todosAutores = await Autor.findAll();
  for (const a of todosAutores) autorCacheRefresh[a.name] = a;

  let ii = 0;
  while (ii < rows.length) {
    const r = rows[ii];
    const tipo = (r[1] || '').toUpperCase().trim();
    if (!TIPOS_PI_MAP[tipo]) { ii++; continue; }

    const nomes = splitAutores(r[11] || '');
    const autoresBloco = nomes.map(n => autorCacheRefresh[n]).filter(Boolean);

    // Avança até a linha que contém TELEFONE na coluna 8
    let jj = ii + 1;
    let foundPhoneHeader = false;
    while (jj < rows.length) {
      const pr = rows[jj];
      const ptipo = (pr[1] || '').toUpperCase().trim();
      if (TIPOS_PI_MAP[ptipo] || ptipo === 'TIPO') break;
      if ((pr[8] || '').trim().toUpperCase() === 'TELEFONE') {
        foundPhoneHeader = true;
        jj++;
        break;
      }
      jj++;
    }

    // Coleta telefone/email e associa aos autores na ordem
    if (foundPhoneHeader) {
      let autorIdx = 0;
      while (jj < rows.length && autorIdx < autoresBloco.length) {
        const pr = rows[jj];
        const ptipo = (pr[1] || '').toUpperCase().trim();
        if (TIPOS_PI_MAP[ptipo] || ptipo === 'TIPO') break;

        const telefone = (pr[8] || '').trim();
        const email = (pr[10] || '').trim();
        if (telefone || email) {
          const autor = autoresBloco[autorIdx];
          const updates = {};
          if (telefone) updates.phone = trunca(telefone, 20);
          if (email) updates.email = trunca(email, 50);
          await Autor.update(updates, { where: { id: autor.id } });
          autoresAtualizados++;
          autorIdx++;
        }
        jj++;
      }
    }

    // Avança ii para o fim deste bloco de PI
    ii = jj;
  }
  console.log(`Autores com telefone/email atualizados: ${autoresAtualizados}`);

  // ---- 3. Sincroniza notificações ----
  const { sincronizarNotificacoes } = require('../src/services/notificacaoService');
  await sincronizarNotificacoes(true);

  const q = async sql => (await sequelize.query(sql))[0];
  const [cPi, cAutor, cPag, cRpi] = await Promise.all([
    q('SELECT COUNT(*)::int AS n FROM pi'),
    q('SELECT COUNT(*)::int AS n FROM autor'),
    q('SELECT COUNT(*)::int AS n FROM pagamentos'),
    q('SELECT COUNT(*)::int AS n FROM "RPI"')
  ]);
  console.log('=== RESUMO DA IMPORTAÇÃO ===');
  console.log(`PIs importadas: ${pisImportadas} (${puladas} puladas) | Pagamentos: ${pagamentosImportados} | RPIs: ${rpisImportadas}`);
  console.log(`Totais no banco → PIs: ${cPi[0].n} | Autores: ${cAutor[0].n} | Pagamentos: ${cPag[0].n} | RPIs: ${cRpi[0].n}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Erro na importação:', err);
  process.exit(1);
});