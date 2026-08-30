import { useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { X, ShieldCheck, Loader2, Save, ArrowDown, ArrowUp } from 'lucide-react';

interface Variant {
  id: string;
  stock: number;
  minStock: number;
  size: { name: string };
  color: { name: string };
}

export default function AdjustStockModal({
  variant,
  productName,
  onClose,
  onSuccess,
}: {
  variant: Variant;
  productName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const currentStock = variant.stock;
  const difference = parseInt(newStock) - currentStock || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`/products/variants/${variant.id}/adjust`, {
        newStock: parseInt(newStock),
        reason,
        adminEmail,
        adminPassword,
      });
      toast.success('Inventario ajustado y registrado en Kardex correctamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al ajustar stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* Cabecera */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <ShieldCheck size={20} className="text-indigo-600" /> Ajustar Inventario
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info del Producto */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{productName}</p>
            <p className="text-xs text-slate-500 mt-1">
              Talla: {variant.size?.name} | Color: {variant.color?.name}
            </p>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm text-slate-500">Stock en Sistema:</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {currentStock} und.
              </span>
            </div>
          </div>

          {/* Input Nuevo Stock */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
              Stock Real Contado *
            </label>
            <input
              type="number"
              required
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Indicador Visual de Diferencia */}
          {newStock !== '' && difference !== 0 && (
            <div
              className={`p-3 rounded-lg flex items-center gap-3 text-sm font-medium ${difference < 0 ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'}`}
            >
              {difference < 0 ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
              <span>
                Se {difference < 0 ? 'descontarán' : 'agregarán'} {Math.abs(difference)} unidades.
              </span>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
              Motivo del Ajuste *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Ej: Mercancía dañada, error de conteo inicial..."
            />
          </div>

          {/* Credenciales Admin */}
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-700 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Autorización de Administrador *
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors hover:text-slate-900 dark:hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Autorizar Ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
