import API_URL from '../config';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const API = API_URL;

const NotificacoesContext = createContext();

export function NotificacoesProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const refreshing = useRef(false);
  const { token } = useAuth();

  const refresh = useCallback(async () => {
    if (!token) return;
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const res = await axios.get(`${API}/api/notificacoes/count`);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    } finally {
      refreshing.current = false;
    }
  }, [token]);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    try {
      await axios.post(`${API}/api/notificacoes/marcar-todas-lidas`);
      setUnreadCount(0);
    } catch (err) {
      console.error('Erro ao marcar notificações como lidas:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) refresh();
    else setUnreadCount(0);
  }, [refresh, location.pathname, token]);

  useEffect(() => {
    let id;
    const start = () => {
      clearInterval(id);
      id = setInterval(() => refresh(), 60000);
    };
    const stop = () => clearInterval(id);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  return (
    <NotificacoesContext.Provider value={{ unreadCount, refresh, markAllRead }}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  return useContext(NotificacoesContext);
}
