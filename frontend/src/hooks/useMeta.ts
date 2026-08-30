import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

export interface MetaData {
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  sizes: { id: string; name: string }[];
  colors: { id: string; name: string; hex: string }[];
}

export const useMeta = () => {
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMeta = async () => {
    try {
      const response = await axios.get('/meta');
      setMeta(response.data.data);
    } catch (error) {
      console.error('Error al cargar metadatos', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  const createCategory = async (name: string) => {
    try {
      const response = await axios.post('/categories', { name });
      setMeta((prev) => prev ? { ...prev, categories: [...prev.categories, response.data.data] } : prev);
      toast.success('Categoría creada');
      return response.data.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear categoría');
      return null;
    }
  };

  const createBrand = async (name: string) => {
    try {
      const response = await axios.post('/brands', { name });
      setMeta((prev) => prev ? { ...prev, brands: [...prev.brands, response.data.data] } : prev);
      toast.success('Marca creada');
      return response.data.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear marca');
      return null;
    }
  };

  // ✅ Devolvemos fetchMeta por si creamos un catálogo en la ventana de configuración y queremos refrescar el selector
  return { meta, loading, fetchMeta, createCategory, createBrand };
};