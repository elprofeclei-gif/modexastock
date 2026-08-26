import { useState, useEffect } from 'react';
import axios from '../api/axios';

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
  paymentMethod: string;
  reference: string | null;
  createdAt: string;
  user: { name: string };
  items: SaleItem[];
}

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await axios.get('/sales');
        setSales(response.data.data);
      } catch (error) {
        console.error('Error fetching sales', error);
      } finally {
        setLoading(false);
      }
    };
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
      return true; // <-- AÑADIDO
    } catch (error) {
      toast.error('Error al descargar el reporte');
      return false; // <-- AÑADIDO
    }
  };

  return { sales, loading, downloadReport };
};
