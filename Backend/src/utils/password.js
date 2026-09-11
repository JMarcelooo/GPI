// BUG-011: política de senha forte — mínimo 8 chars, 1 maiúscula, 1 minúscula, 1 número, 1 símbolo.
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const SENHA_FRACA_MSG = 'A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e símbolo.';

function validarSenhaForte(senha) {
  return STRONG_PASSWORD.test(String(senha || ''));
}

module.exports = { validarSenhaForte, SENHA_FRACA_MSG, STRONG_PASSWORD };
