import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setAuth, clearAuth, getStoredUser, getToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    const token = getToken();
    if (token && !user) {
      api
        .get('/auth/me')
        .then(({ data }) => {
          setAuth(null, data.user);
          setUser(data.user);
        })
        .catch(() => {
          clearAuth();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const login = useCallback(async (identifier, password, rememberMe) => {
    const { data } = await api.post('/auth/login', { identifier, password, rememberMe });
    setAuth(data.token, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    window.location.href = '/login';
  }, []);

  return <AuthContext.Provider value={{ user, setUser, loading, login, logout, isAdmin: user?.role === 'HR_ADMIN', isManager: user?.role === 'MANAGER', isEmployee: user?.role === 'EMPLOYEE' }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
