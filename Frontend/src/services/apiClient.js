import axios from 'axios';

const STORAGE_TOKEN = 'gpi_token';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem(STORAGE_TOKEN);
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  res => res,
  error => {
    const status = error.response?.status;
    const isAuthCall = String(error.config?.url || '').includes('/api/auth/login');
    const hadToken = !!localStorage.getItem(STORAGE_TOKEN);

    if (status === 401 && hadToken && !isAuthCall) {
      localStorage.removeItem(STORAGE_TOKEN);
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
