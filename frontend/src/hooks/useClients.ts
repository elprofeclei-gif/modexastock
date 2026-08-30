import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  balance: number;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const res = await axios.get('/clients');
      setClients(res.data.data);
    } catch (error) {
      console.error('Error fetching clients', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const createClient = async (data: any) => {
    try {
      const res = await axios.post('/clients', data);
      setClients((prev) => [...prev, res.data.data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Cliente creado');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error');
      return false;
    }
  };

  const updateClient = async (id: string, data: any) => {
    try {
      const res = await axios.put(`/clients/${id}`, data);
      setClients((prev) => prev.map((c) => (c.id === id ? res.data.data : c)));
      toast.success('Cliente actualizado');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error');
      return false;
    }
  };

  const deleteClient = async (id: string, adminEmail: string, adminPassword: string) => {
    try {
      await axios.delete(`/clients/${id}`, { data: { adminEmail, adminPassword } });
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast.success('Cliente eliminado');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
      return false;
    }
  };

  // ✅ AQUÍ ESTÁ LA SOLUCIÓN: Se agregó fetchClients al return
  return { clients, loading, fetchClients, createClient, updateClient, deleteClient };
};
