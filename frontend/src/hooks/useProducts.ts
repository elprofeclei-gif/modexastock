import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { ProductFormData } from '../schemas/productSchema';

export interface Variant {
  id: string;
  stock: number;
  minStock: number;
  size: { name: string };
  color: { name: string; hex: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  imageUrl: string | null;
  category: { id: string; name: string };
  brand: { id: string; name: string };
  variants: Variant[];
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      // ✅ Le pasamos el parámetro limit=1000 para que traiga el inventario completo
      const response = await axios.get('/products?limit=1000');
      setProducts(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const createProduct = async (data: ProductFormData) => {
    try {
      const response = await axios.post('/products', data);
      setProducts((prev) => [response.data.data, ...prev]);
      toast.success('Producto creado exitosamente');
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear el producto');
      return false;
    }
  };

  // ✅ AGREGADO fetchProducts y setProducts al return
  return { products, loading, error, createProduct, fetchProducts, setProducts };
};
