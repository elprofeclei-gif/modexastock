import { useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format'; // <-- Import

export const usePurchases = () => {
  const [loading, setLoading] = useState(false);

  const createVendor = async (name: string, phone?: string, email?: string) => {
    try {
      const response = await axios.post('/vendors', { name, phone, email });
      toast.success('Proveedor creado');
      return response.data.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear proveedor');
      return null;
    }
  };

  const getVendors = async () => {
    try {
      const response = await axios.get('/vendors');
      return response.data.data;
    } catch (error) {
      return [];
    }
  };

  const getAccounts = async () => {
    try {
      const response = await axios.get('/treasury/accounts');
      return response.data.data;
    } catch (error) {
      return [];
    }
  };

  const createPurchase = async (items: any[], vendorId: string, accountId?: string) => {
    setLoading(true);
    try {
      const response = await axios.post('/purchases', { items, vendorId, accountId });
      // FORMATO EN TOAST
      toast.success(`Compra registrada: ${formatCurrency(response.data.data.totalAmount)}`);
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar compra');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { createVendor, getVendors, getAccounts, createPurchase, loading };
};
