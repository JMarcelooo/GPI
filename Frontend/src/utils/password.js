const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const SENHA_FRACA_MSG = 'A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e símbolo.';

export function validarSenhaForte(senha) {
  return STRONG_PASSWORD.test(String(senha || ''));
}
