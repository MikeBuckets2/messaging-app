import { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth';
import { updateLastSeen } from '../api/users';

const AuthContext = createContext(null);

const LAST_SEEN_INTERVAL_MS = 30_000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    };

    authApi
      .getMe()
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false))
  }, []);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      updateLastSeen().catch(console.error);
    }, LAST_SEEN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    const { user, token } = await authApi.login({ email, password });
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const register = async (username, email, password) => {
    const { user, token } = await authApi.register({ username, email, password });
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};