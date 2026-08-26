import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

// 1. Definimos el tipado estricto
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  isActive: boolean;
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false);

  // 2. Parseamos de forma segura al inicializar el estado
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? (JSON.parse(userStr) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user); // Actualizamos el estado de React

      toast.success(`Bienvenido, ${user.name}!`);
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Sesión cerrada');
  };

  const updateProfile = async (data: { name: string; email: string; password?: string }) => {
    try {
      const response = await axios.put('/auth/profile', data);
      localStorage.setItem('user', JSON.stringify(response.data.data));
      setUser(response.data.data); // Actualizamos el estado
      toast.success('Perfil actualizado correctamente');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar perfil');
      return false;
    }
  };

  return { login, logout, loading, user, updateProfile };
};
