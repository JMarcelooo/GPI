// BUG-011: política de senha forte — mínimo 8 chars, 1 maiúscula, 1 minúscula, 1 número, 1 símbolo.
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

const SENHA_FRACA_MSG = 'A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e símbolo.';

const SENHA_MAX = 72; // bcrypt trunc em 72 bytes

function validarSenhaForte(senha) {
  const s = String(senha || '');
  return s.length >= 8 && s.length <= SENHA_MAX && STRONG_PASSWORD.test(s);
}

module.exports = { validarSenhaForte, SENHA_FRACA_MSG, STRONG_PASSWORD, SENHA_MAX };
