import { useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

// 1. Definimos el tipado estricto (CON PHONE Y BALANCE AGREGADOS)
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  isActive: boolean;
  phone?: string; // ✅ AGREGADO
  balance?: number; // ✅ AGREGADO (por si usas el módulo de descuadres)
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
      const { user } = response.data;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'cookie-active');

      setUser(user);
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

  // 3. Actualizamos la ruta a /users/profile y agregamos el teléfono
  const updateProfile = async (data: { name: string; email: string; phone?: string }) => {
    try {
      const response = await axios.put('/users/profile', data);
      const updatedUser = response.data.data;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser); // Actualizamos el estado de React al instante
      toast.success('Perfil actualizado correctamente');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar perfil');
      return false;
    }
  };

  return { login, logout, loading, user, updateProfile };
};
