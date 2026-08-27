// Eventos de UI desacoplados para uso fora do React (interceptors, etc.).
// Permite que o interceptor do axios dispare toasts e o "sessão expirada"
// sem acoplar ao ciclo de vida de componentes.

const toastListeners = new Set();
export function onToast(cb) {
  toastListeners.add(cb);
  return () => toastListeners.delete(cb);
}
export function emitToast(message, type = 'info', opts = {}) {
  toastListeners.forEach((cb) => cb({ message, type, ...opts }));
}

const expiredListeners = new Set();
export function onSessionExpired(cb) {
  expiredListeners.add(cb);
  return () => expiredListeners.delete(cb);
}
export function emitSessionExpired(detail = {}) {
  expiredListeners.forEach((cb) => cb(detail));
}

// Evita spam: avisa a sessão expirada uma vez por episódio (resetada numa
// resposta bem-sucedida ou login).
let warned = false;
export const isWarned = () => warned;
export const setWarned = (v) => { warned = v; };
