import { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
  X,
  History,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  Settings2,
  ShoppingCart,
  Undo2,
} from 'lucide-react';

interface Movement {
  id: string;
  type: string;
  quantityChange: number;
  reason: string | null;
  createdAt: string;
  user: { name: string };
}

export default function KardexModal({
  variantId,
  productName,
  variantDetails,
  onClose,
}: {
  variantId: string;
  productName: string;
  variantDetails: string;
  onClose: () => void;
}) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKardex = async () => {
      try {
        const res = await axios.get(`/products/variants/${variantId}/kardex`);
        setMovements(res.data.data);
      } catch (error) {
        console.error('Error al cargar Kardex', error);
      } finally {
        setLoading(false);
      }
    };
    fetchKardex();
  }, [variantId]);

  const getMovementConfig = (type: string, quantityChange: number) => {
    if (type === 'SALE')
      return {
        icon: ShoppingCart,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        label: 'Venta POS',
      };
    if (type === 'PURCHASE')
      return {
        icon: ArrowDownCircle,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-500/10',
        label: 'Ingreso (Compra)',
      };
    if (type === 'VOID_SALE')
      return {
        icon: Undo2,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-500/10',
        label: 'Devolución / Anulación',
      };
    if (type === 'ADJUSTMENT') {
      return quantityChange > 0
        ? {
            icon: ArrowUpCircle,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-500/10',
            label: 'Ajuste Positivo',
          }
        : {
            icon: Settings2,
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-500/10',
            label: 'Ajuste Negativo',
          };
    }
    return {
      icon: History,
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-700',
      label: type,
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-100 dark:border-slate-700">
        {/* Cabecera */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
              <History className="text-indigo-600 dark:text-indigo-400" size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Kardex / Historial
              </h3>
              <p className="text-xs text-slate-500">
                {productName} - {variantDetails}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cuerpo (Lista de movimientos) */}
        <div className="grow overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
              <History size={48} className="mb-3 opacity-50" />
              <p>No hay movimientos registrados para esta variante.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-4 space-y-6">
              {movements.map((mov) => {
                const config = getMovementConfig(mov.type, mov.quantityChange);
                const Icon = config.icon;

                return (
                  <div key={mov.id} className="relative pl-8">
                    {/* Punto en la línea de tiempo */}
                    <div
                      className={`absolute -left-[1.15rem] top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-800 ${config.bg}`}
                    >
                      <Icon className={config.color} size={14} />
                    </div>

                    {/* Tarjeta del movimiento */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${config.bg} ${config.color}`}
                        >
                          {config.label}
                        </span>
                        <span
                          className={`text-lg font-extrabold ${mov.quantityChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                          {mov.quantityChange > 0 ? '+' : ''}
                          {mov.quantityChange} und.
                        </span>
                      </div>

                      {mov.reason && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 italic">
                          "{mov.reason}"
                        </p>
                      )}

                      <div className="flex justify-between items-center text-xs text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span>
                          Por:{' '}
                          <strong className="text-slate-600 dark:text-slate-300">
                            {mov.user?.name || 'N/A'}
                          </strong>
                        </span>
                        <span>{formatDate(mov.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
