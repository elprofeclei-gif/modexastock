import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { usePurchases } from '../hooks/usePurchases';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/format';
import { playSound } from '../utils/sound';
import toast from 'react-hot-toast';
import { Search, Plus, Save } from 'lucide-react';

export default function Purchases() {
  const { createVendor, getVendors, getAccounts, createPurchase, loading } = usePurchases();
  const [vendors, setVendors] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setVendors(await getVendors());
      setAccounts(await getAccounts());
    };
    fetchInitialData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const response = await axios.get(`/pos/products/search?query=${searchQuery}`);
    setSearchResults(response.data.data);
  };

  const addToCart = (product: any, variant: any) => {
    if (cart.find((item) => item.productVariantId === variant.id)) {
      toast.error('Variante ya en la lista');
      return;
    }
    setCart([
      ...cart,
      {
        productVariantId: variant.id,
        name: product.name,
        sku: product.sku,
        size: variant.size.name,
        color: variant.color.name,
        quantity: 1,
        unitCost: 0,
      },
    ]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const updateCartItem = (id: string, field: string, value: string) => {
    const numericValue = parseFormattedNumber(value);
    setCart(
      cart.map((item) => (item.productVariantId === id ? { ...item, [field]: numericValue } : item))
    );
  };

  const handleAddVendor = async () => {
    const name = prompt('Nombre del nuevo proveedor:');
    if (name) {
      const newVendor = await createVendor(name);
      if (newVendor) {
        setVendors([...vendors, newVendor]);
        setSelectedVendor(newVendor.id);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedVendor) return toast.error('Selecciona un proveedor');
    const success = await createPurchase(cart, selectedVendor, selectedAccount || undefined);
    if (success) {
      playSound('success');
      setCart([]);
    } else {
      playSound('error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Registrar Compra</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Entrada de inventario y registro de gastos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Búsqueda y Items */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto por nombre o SKU..."
                className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              />
            </div>
          </form>

          {searchResults.length > 0 && (
            <div className="mb-6 border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden">
              {searchResults.map((p) =>
                p.variants.map((v: any) => (
                  <div
                    key={v.id}
                    className="p-3 border-b border-slate-100 dark:border-slate-700 last:border-0 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  >
                    <span className="text-sm text-slate-900 dark:text-white">
                      {p.name}{' '}
                      <span className="text-slate-400">
                        ({v.size.name}/{v.color.name})
                      </span>
                    </span>
                    <button
                      onClick={() => addToCart(p, v)}
                      className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-md font-medium flex items-center gap-1"
                    >
                      <Plus size={14} /> Añadir
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
            Items a Comprar
          </h3>
          <div className="border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Producto</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-500">Cant.</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-500">Costo Unit.</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-500">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-400">
                      Lista vacía
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item.productVariantId}>
                      <td className="py-3 px-3 text-slate-900 dark:text-white">
                        {item.name}{' '}
                        <span className="text-xs text-slate-400 block">
                          {item.size}/{item.color}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatInputNumber(item.quantity.toString())}
                          onChange={(e) =>
                            updateCartItem(item.productVariantId, 'quantity', e.target.value)
                          }
                          className="w-16 px-2 py-1 text-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="text-center py-3 px-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatInputNumber(item.unitCost.toString())}
                          onChange={(e) =>
                            updateCartItem(item.productVariantId, 'unitCost', e.target.value)
                          }
                          className="w-24 px-2 py-1 text-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="text-center py-3 px-3 text-slate-900 dark:text-white font-medium">
                        {formatCurrency(item.quantity * item.unitCost)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna Resumen */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 h-fit flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Datos de la Compra
          </h3>

          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
            Proveedor
          </label>
          <div className="flex space-x-2 mb-4">
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            >
              <option value="">Selecciona...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddVendor}
              className="px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200"
            >
              <Plus size={16} />
            </button>
          </div>

          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
            Origen de Fondos
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full px-3 py-2.5 mb-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
          >
            <option value="">Caja Actual (Efectivo)</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2 mb-6">
            <div className="flex justify-between items-center text-xl font-bold text-slate-900 dark:text-white">
              <span>Total:</span>
              <span>
                {formatCurrency(cart.reduce((acc, item) => acc + item.quantity * item.unitCost, 0))}
              </span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || cart.length === 0 || !selectedVendor}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold rounded-lg transition-colors mt-auto flex items-center justify-center gap-2"
          >
            {loading ? (
              'Registrando...'
            ) : (
              <>
                <Save size={18} /> REGISTRAR COMPRA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
