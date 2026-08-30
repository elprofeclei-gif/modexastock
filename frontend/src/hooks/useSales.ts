import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

export interface SaleItem {
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productVariant: {
    product: { name: string };
    size: { name: string };
    color: { name: string };
  };
}

export interface Sale {
  id: string;
  totalAmount: number;
  discountAmount?: number;
  paymentMethod: string;
  reference: string | null;
  createdAt: string;
  receivedAmount: number;
  change: number;
  user: { name: string };
  client?: { name: string; document?: string | null } | null;
  items: SaleItem[];
  isVoided?: boolean;
  voidedReason?: string;
  voidedAt?: string;
}

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Estado para los filtros
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: ''
  });

  const fetchSales = async (currentFilters?: any) => {
    setLoading(true);
    try {
      const f = currentFilters || filters;
      const query = new URLSearchParams();
      if (f.search) query.append('search', f.search);
      if (f.startDate) query.append('startDate', f.startDate);
      if (f.endDate) query.append('endDate', f.endDate);
      
      const response = await axios.get(`/sales?${query.toString()}`);
      setSales(response.data.data);
    } catch (error) {
      console.error('Error fetching sales', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const downloadReport = async () => {
    try {
      const response = await axios.get('/reports/sales/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_ventas_modexastock.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte descargado');
      return true;
    } catch (error) {
      toast.error('Error al descargar el reporte');
      return false;
    }
  };

  return { sales, loading, fetchSales, filters, setFilters, downloadReport };
};