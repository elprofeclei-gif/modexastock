import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createUser = async (data: any) => {
    try {
      const response = await axios.post('/users', data);
      setUsers((prev) => [response.data.data, ...prev]);
      toast.success('Usuario creado exitosamente');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear usuario');
      return false;
    }
  };

  const updateUser = async (id: string, data: any) => {
    try {
      const response = await axios.put(`/users/${id}`, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? response.data.data : u)));
      toast.success('Usuario actualizado');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
      return false;
    }
  };

  const deleteUser = async (id: string, adminEmail: string, adminPassword: string) => {
    try {
      await axios.delete(`/users/${id}`, { data: { adminEmail, adminPassword } });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success('Usuario eliminado correctamente');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
      return false;
    }
  };
  const toggleStatus = async (id: string) => {
    try {
      const res = await axios.put(`/users/${id}/toggle-status`);
      setUsers((prev) => prev.map((u) => (u.id === id ? res.data.data : u)));
      toast.success('Estado actualizado');
      return true; // <-- AÑADE ESTO
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error');
      return false; // <-- AÑADE ESTO
    }
  };
  return { users, loading, createUser, updateUser, deleteUser, toggleStatus };
};
