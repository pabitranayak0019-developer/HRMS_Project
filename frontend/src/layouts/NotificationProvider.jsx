import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications', { params: { limit: 20 } });
      setNotifications(data.data);
      setUnread(data.unread);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markRead = useCallback(
    async (id) => {
      try {
        await api.put(`/notifications/${id}/read`);
        setNotifications((n) => n.map((x) => (x._id === id ? { ...x, isRead: true } : x)));
        setUnread((u) => Math.max(0, u - 1));
      } catch {
        /* ignore */
      }
    },
    []
  );

  const markAllRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <NotificationsContext.Provider value={{ unread, notifications, refresh, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
