import axios from 'axios';

// BUG-006: o token agora vive em cookie httpOnly (definido pelo backend no
// login). O navegador o envia automaticamente; basta habilitar credentials.
// Não lemos/armazenamos o token em JS (evita roubo por XSS).
axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  res => res,
  error => {
    const status = error.response?.status;
    const isAuthCall = String(error.config?.url || '').includes('/api/auth/login');
    const hadUser = !!localStorage.getItem('gpi_user');

    // 401 com usuário logado (token revogado/expirado): descarta o usuário
    // local e manda para o login (recarregando a página para resetar o estado).
    if (status === 401 && hadUser && !isAuthCall) {
      localStorage.removeItem('gpi_user');
      const path = window.location.pathname;
      if (path !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
