import API_URL from '../config';
import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

const STORAGE_USER = 'gpi_user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // BUG-006: não guardamos o token em localStorage (XSS-stealable). O token
  // fica em cookie httpOnly; aqui mantemos apenas o usuário para a UI.
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback(async (email, senha) => {
    const API = API_URL;
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, senha })
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
