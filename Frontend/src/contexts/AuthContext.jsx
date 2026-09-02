import API_URL from '../config';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onSessionExpired } from '../services/events';

const AuthContext = createContext();

const STORAGE_USER = 'gpi_user';

export function AuthProvider({ children }) {
  // BUG-006: não guardamos o token em localStorage (XSS-stealable). O token
  // fica em cookie httpOnly; aqui mantemos apenas o usuário para a UI.
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // UX-02 (início): não confiamos no localStorage para definir o estado
  // inicial — validamos a sessão real em /api/auth/me. Se o cookie estiver
  // expirado/inválido, o app inicia no login (e não "pula" para o dashboard).
  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no-auth'))))
      .then((data) => { if (active) setUser(data.user || data); })
      .catch(() => {
        if (active) {
          localStorage.removeItem(STORAGE_USER);
          setUser(null);
        }
      });
    return () => { active = false; };
  }, []);

  // UX-02: o interceptor avisa (toast) e, após 5s, dispara isso. Limpa o estado
  // local e manda para o login preservando a rota de origem (state.from), para
  // o usuário voltar de onde estava após relogar.
  useEffect(() => onSessionExpired(({ from }) => {
    localStorage.removeItem(STORAGE_USER);
    setUser(null);
    navigate('/login', { state: { from: from || '/dashboard' } });
  }), [navigate]);

  const login = useCallback(async (identificador, senha) => {
    const API = API_URL;
    const body = identificador && identificador.includes('@')
      ? { email: identificador, senha }
      : { username: identificador, identificador, senha };
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Falha ao autenticar.');
      err.status = res.status;
      throw err;
    }

    localStorage.setItem(STORAGE_USER, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // ignora erros de rede no logout
    }
    localStorage.removeItem(STORAGE_USER);
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser(prev => {
      const next = prev ? { ...prev, ...patch } : prev;
      if (next) localStorage.setItem(STORAGE_USER, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
