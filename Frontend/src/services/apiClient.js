import axios from 'axios';
import { emitToast, emitSessionExpired, isWarned, setWarned } from './events';

// BUG-006: o token agora vive em cookie httpOnly (definido pelo backend no
// login). O navegador o envia automaticamente; basta habilitar credentials.
// Não lemos/armazenamos o token em JS (evita roubo por XSS).
axios.defaults.withCredentials = true;

let logoutTimer = null;

axios.interceptors.response.use(
  (res) => {
    // Resposta ok -> rearmamos o aviso de sessão para o próximo episódio.
    setWarned(false);
    return res;
  },
  (error) => {
    const status = error.response?.status;
    const isAuthCall = String(error.config?.url || '').includes('/api/auth/login');
    const hadUser = !!localStorage.getItem('gpi_user');

    // UX-02: avisa o usuário (toast) e faz o logout automático após 5s,
    // preservando a rota de origem (state.from) para voltar após relogar.
    // Não fazemos reload da página — a navegação é feita via SPA.
    if (status === 401 && hadUser && !isAuthCall && !isWarned()) {
      setWarned(true);
      const from = window.location.pathname + window.location.search;
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => emitSessionExpired({ from }), 5000);
      emitToast('Sua sessão expirou. Você será redirecionado ao login em instantes.', 'error', {
        actionLabel: 'Ir para o login',
        onAction: () => {
          if (logoutTimer) clearTimeout(logoutTimer);
          emitSessionExpired({ from });
        },
        duration: 5000
      });
    }
    return Promise.reject(error);
  }
);

export default axios;
