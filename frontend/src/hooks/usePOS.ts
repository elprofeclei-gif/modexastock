import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { Product } from '../hooks/useProducts';
import { formatCurrency } from '../utils/format';

export interface CartItem {
  productVariantId: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  isWholesale: boolean;
  retailPrice: number;
  wholesalePrice: number;
}

export const usePOS = () => {
  const [cashRegister, setCashRegister] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [productForVariant, setProductForVariant] = useState<Product | null>(null);
  const [suggestedOpening, setSuggestedOpening] = useState(0);
  const [isLoadingRegister, setIsLoadingRegister] = useState(true);
  const [discount, setDiscount] = useState(0);

  const checkOpenCashRegister = async () => {
    try {
      const response = await axios.get('/pos/cash-register/current');
      if (response.status === 200) {
        setCashRegister(response.data.data);
        if (response.data.suggestedOpening !== undefined) {
          setSuggestedOpening(response.data.suggestedOpening);
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error checking cash register', error);
      } else {
        setCashRegister(null);
      }
    } finally {
      setIsLoadingRegister(false);
    }
  };

  useEffect(() => {
    checkOpenCashRegister();
  }, []);

  const openCashRegister = async (
    boxId: string,
    amount: number,
    adminAuth?: { email: string; password: string },
    originAccountId?: string
  ) => {
    setLoading(true);
    try {
      const response = await axios.post('/pos/cash-register/open', {
        physicalBoxId: boxId,
        openingAmount: amount,
        adminEmail: adminAuth?.email,
        adminPassword: adminAuth?.password,
        originAccountId: originAccountId === 'CAPITAL' ? undefined : originAccountId,
      });

      if (response.data.status === 'success') {
        setCashRegister(response.data.data);
        toast.success('Caja abierta correctamente.');
        setLoading(false);
        return true;
      } else {
        toast.error(response.data.message || 'No se pudo abrir la caja.');
        setLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('Error al abrir caja:', error);
      const errorMessage = error.response?.data?.message || 'Error de conexión al abrir la caja.';
      toast.error(errorMessage);
      setLoading(false);
      return false;
    }
  };

  const closeCashRegister = async (
    countedAmount: number,
    depositAmount?: number,
    depositAccountId?: string
  ) => {
    try {
      const response = await axios.post('/pos/cash-register/close', {
        countedAmount,
        depositAmount,
        depositAccountId,
      });
      setCashRegister(null);
      await checkOpenCashRegister();
      return response.data.data.summary;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cerrar caja');
      return null;
    }
  };

  const transferToCashRegister = async (data: {
    accountId: string;
    amount: number;
    adminEmail: string;
    adminPassword: string;
  }) => {
    try {
      await axios.post('/pos/cash-register/transfer-in', data);
      await checkOpenCashRegister();
      toast.success('Fondo transferido a caja correctamente');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al transferir fondo');
      return false;
    }
  };

  const withdrawFromCashRegister = async (data: {
    accountId?: string;
    amount: number;
    adminEmail: string;
    adminPassword: string;
    concept?: string;
  }) => {
    try {
      await axios.post('/pos/cash-register/withdraw', data);
      await checkOpenCashRegister();
      toast.success('Fondo retirado de caja correctamente');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al retirar fondo');
      return false;
    }
  };

  const searchAndAddProduct = async (query: string) => {
    if (!query) return;
    try {
      const response = await axios.get(`/pos/products/search?query=${query}`);
      const products = response.data.data;

      if (products.length === 0) {
        toast.error('Producto no encontrado');
        return;
      }

      const product = products.find((p: any) => p.sku === query) || products[0];

      if (product.variants.length === 0) {
        toast.error('Producto sin stock disponible');
        return;
      }

      if (product.variants.length === 1) {
        addToCart(product, product.variants[0]);
      } else {
        setProductForVariant(product);
      }
    } catch (error) {
      toast.error('Error al buscar producto');
    }
  };

  const addToCart = (product: any, variant: any) => {
    const retail = product.price;
    const wholesale = product.wholesalePrice || retail;

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productVariantId === variant.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.productVariantId === variant.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      const newItem: CartItem = {
        productVariantId: variant.id,
        name: product.name,
        sku: product.sku,
        size: variant.size.name,
        color: variant.color.name,
        quantity: 1,
        unitPrice: retail,
        retailPrice: retail,
        wholesalePrice: wholesale,
        subtotal: retail,
        isWholesale: false,
      };
      return [...prevCart, newItem];
    });

    setProductForVariant(null);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productVariantId === id
          ? { ...item, quantity, subtotal: quantity * item.unitPrice }
          : item
      )
    );
  };

  const toggleWholesale = (id: string) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.productVariantId === id) {
          const newIsWholesale = !item.isWholesale;
          const newUnitPrice = newIsWholesale ? item.wholesalePrice : item.retailPrice;
          return {
            ...item,
            isWholesale: newIsWholesale,
            unitPrice: newUnitPrice,
            subtotal: item.quantity * newUnitPrice,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productVariantId !== id));
  };

  // SUSPENDER VENTA ACTUAL
  const suspendCurrentSale = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return false;
    }
    try {
      // ✅ Enviamos el carrito Y el descuento
      await axios.post('/pos/sales/suspend', { items: cart, discount });
      setCart([]);
      setDiscount(0); // ✅ Borramos el descuento de la pantalla actual
      toast.success('Venta suspendida correctamente');
      return true;
    } catch (error) {
      toast.error('Error al suspender venta');
      return false;
    }
  };

  // OBTENER VENTAS SUSPENDIDAS
  const fetchSuspendedSales = async () => {
    try {
      const res = await axios.get('/pos/sales/suspended');
      return res.data.data;
    } catch (error) {
      return [];
    }
  };

  // RECUPERAR VENTA SUSPENDIDA
  const resumeSuspendedSale = async (id: string, items: CartItem[], discountAmount: number = 0) => {
    try {
      setCart(items);
      setDiscount(discountAmount); // ✅ Restauramos el descuento guardado
      await axios.delete(`/pos/sales/suspended/${id}`);
      toast.success('Venta recuperada');
    } catch (error) {
      toast.error('Error al recuperar venta');
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const processSale = async (payments: any[], clientId?: string, discountAmount?: number) => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return false;
    }
    setLoading(true);
    try {
      const items = cart.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
      }));

      const payload: any = { items, payments, discountAmount };
      if (clientId) payload.clientId = clientId;

      const response = await axios.post('/pos/sales', payload);

      const cashPayment = payments.find((p) => p.method === 'CASH');
      const successMsg = cashPayment
        ? `Venta procesada. Cambio: ${formatCurrency(response.data.data.change)}`
        : 'Venta procesada exitosamente';
      toast.success(successMsg);

      setCart([]);
      setDiscount(0);
      await checkOpenCashRegister();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al procesar la venta');
      return false;
    } finally {
      setLoading(false);
    }
  };
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const total = subtotal - discount; // ✅ El total final le resta el descuento

  return {
    cashRegister,
    openCashRegister,
    closeCashRegister,
    cart,
    searchAndAddProduct,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    processSale,
    discount,
    setDiscount,
    subtotal,
    total,
    loading,
    productForVariant,
    setProductForVariant,
    suggestedOpening,
    isLoadingRegister,
    transferToCashRegister,
    withdrawFromCashRegister,
    toggleWholesale,
    suspendCurrentSale,
    fetchSuspendedSales,
    resumeSuspendedSale,
  };
};
