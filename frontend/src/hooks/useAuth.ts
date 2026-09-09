import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { authApi } from '../services/auth';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      api
        .get<{ user: User }>('/user/profile')
        .then(res => setUser(res.user))
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });

      localStorage.setItem('token', res.token);
      setUser(res.user);
    },
    []
  );

  const register = useCallback(
    async (
      email: string,
      username: string,
      password: string,
      fullName: string,
      phone: string
    ) => {
      const res = await authApi.register({
        email,
        username,
        password,
        fullName,
        phone,
      });

      localStorage.setItem('token', res.token);
      setUser(res.user);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return {
    user,
    loading,
    login,
    register,
    logout,
  };
}
