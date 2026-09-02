const crypto = require('crypto');

let transporter = null;
let transporterTried = false;
function getTransporter() {
  if (transporterTried) return transporter;
  transporterTried = true;
  try {
    const nodemailer = require('nodemailer');
    const smtpUrl = process.env.SMTP_URL;
    const smtpHost = process.env.SMTP_HOST;
    if (smtpUrl) {
      transporter = nodemailer.createTransport(smtpUrl);
    } else if (smtpHost) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || 'false') === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
      });
    } else {
      transporter = null;
    }
  } catch {
    transporter = null;
  }
  return transporter;
}

async function enviarViaResend({ para, assunto, texto, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const from = process.env.RESEND_FROM || process.env.SMTP_FROM || 'UERN Inova <onboarding@resend.dev>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: para,
        subject: assunto,
        html: html || `<p>${(texto || '').replace(/\n/g, '<br>')}</p>`,
        text: texto
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Resend ${res.status}`);
    }
    console.log(`✉️  E-mail enviado via Resend para ${para}: ${assunto} (id: ${data.id || '—'})`);
    return true;
  } catch (err) {
    console.error('Falha ao enviar via Resend:', err.message);
    return null;
  }
}

async function enviarEmail({ para, assunto, texto, html }) {
  // 1) Tenta Resend se configurado (prioridade, como solicitado)
  if (process.env.RESEND_API_KEY) {
    const r = await enviarViaResend({ para, assunto, texto, html });
    if (r === true) return true;
    if (r === null) {
      // null = erro, cai para SMTP/mock
    }
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@uern-inova.local';
  const t = getTransporter();
  if (t) {
    try {
      await t.sendMail({ from, to: para, subject: assunto, text: texto, html });
      console.log(`✉️  E-mail enviado para ${para}: ${assunto}`);
      return true;
    } catch (err) {
      console.error('Falha ao enviar e-mail via SMTP, caindo para log:', err.message);
    }
  }
  // Fallback: log no console (útil em dev/teste sem SMTP/Resend)
  console.log('— — — E-MAIL MOCK — — —');
  console.log(`Para: ${para}`);
  console.log(`Assunto: ${assunto}`);
  if (texto) console.log(`Texto: ${texto}`);
  if (html) console.log(`HTML: ${html.slice(0, 500)}`);
  console.log('— — — — — — — — — — —');
  return false;
}

function linkAtivacao(token) {
  const base = (process.env.FRONTEND_URL || 'http://localhost:3001').split(',')[0].trim().replace(/\/$/, '');
  return `${base}/ativar-conta/${token}`;
}

async function enviarConvite({ email, nome, username, token }) {
  const link = linkAtivacao(token);
  const assunto = 'Ative sua conta — UERN Inova GPI';
  const texto = `Olá ${nome},\n\nSua conta foi criada no GPI (username: ${username}).\nAtive sua conta definindo sua senha no link abaixo (válido por 48h):\n${link}\n\nSe você não solicitou, ignore este e-mail.`;
  const html = `<p>Olá ${nome},</p><p>Sua conta foi criada no <strong>GPI</strong> (username: <code>${username}</code>).</p><p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#93278F;color:#fff;text-decoration:none;border-radius:8px">Definir senha e ativar conta</a></p><p>Link válido por 48h:<br><a href="${link}">${link}</a></p><p>Se você não solicitou, ignore.</p>`;
  return enviarEmail({ para: email, assunto, texto, html });
}

async function enviarCodigoReset({ email, nome, codigo }) {
  const assunto = 'Código para redefinir senha — UERN Inova GPI';
  const texto = `Olá ${nome},\n\nSeu código para redefinir a senha é: ${codigo}\nVálido por 15 minutos.\nSe não solicitou, ignore.`;
  const html = `<p>Olá ${nome},</p><p>Seu código para redefinir a senha é:</p><p style="font-size:28px;letter-spacing:4px;font-weight:800;background:#F5E8F4;padding:12px 18px;border-radius:8px;display:inline-block">${codigo}</p><p>Válido por 15 minutos. Se não solicitou, ignore.</p>`;
  return enviarEmail({ para: email, assunto, texto, html });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

module.exports = { enviarEmail, enviarConvite, enviarCodigoReset, linkAtivacao, hashToken, getTransporter };
