import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

export interface CompanySettings {
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  ticketFooter: string;
  quoteFooter: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/settings');
      setSettings(res.data.data);
    } catch (error) {
      console.error('Error fetching settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (data: Partial<CompanySettings>) => {
    try {
      const res = await axios.put('/settings', data);
      setSettings(res.data.data);
      toast.success('Datos de la empresa guardados');
      return true;
    } catch (error) {
      toast.error('Error al guardar datos');
      return false;
    }
  };

  return { settings, loading, updateSettings };
};
