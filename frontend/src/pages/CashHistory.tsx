import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/format';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { X, AlertTriangle } from 'lucide-react';

export default function CashHistory() {
  const { user } = useAuth();
  const canForceClose = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // NUEVO: Estado para el modal de cierre forzoso
  const [forceCloseTarget, setForceCloseTarget] = useState<any | null>(null);
  const [forceCloseAmount, setForceCloseAmount] = useState('');

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/pos/cash-register/history');
      setHistory(response.data.data);
    } catch (error) {
      console.error('Error fetching cash history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const openForceCloseModal = (reg: any) => {
    setForceCloseTarget(reg);
    setForceCloseAmount('0');
  };

  const handleForceClose = async () => {
    if (!forceCloseTarget) return;

    const countedAmount = parseFormattedNumber(forceCloseAmount);

    try {
      const res = await axios.post(`/pos/cash-register/${forceCloseTarget.id}/force-close`, {
        countedAmount,
      });
      toast.success(res.data.message);
      setForceCloseTarget(null); // Cerrar modal
      fetchHistory(); // Recargar tabla
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al forzar cierre');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Historial de Caja</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Auditoría de aperturas, cierres, inyecciones, retiros y diferencias.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Cajero
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Apertura
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Inyecciones
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Retiros
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Esperado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Diferencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Depositado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Quedó en Caja
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Fecha
                </th>
                {canForceClose && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acción Admin
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-6 py-8">
                    <Loader />
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-slate-400">
                    No hay movimientos de caja.
                  </td>
                </tr>
              ) : (
                history.map((reg) => (
                  <tr
                    key={reg.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {reg.userName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatCurrency(reg.openingAmount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                      {reg.manualInflows > 0 ? `+${formatCurrency(reg.manualInflows)}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {reg.manualOutflows > 0 ? `-${formatCurrency(reg.manualOutflows)}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                      {reg.expectedAmount !== null ? formatCurrency(reg.expectedAmount) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium">
                      {reg.realAmountCounted !== null ? formatCurrency(reg.realAmountCounted) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold">
                      {reg.difference !== null ? (
                        <span
                          className={
                            reg.difference === 0
                              ? 'text-slate-500'
                              : reg.difference > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                          }
                        >
                          {reg.difference > 0
                            ? `Sobrante: +${formatCurrency(reg.difference)}`
                            : reg.difference < 0
                              ? `Faltante: ${formatCurrency(reg.difference)}`
                              : 'Cuadre Exacto'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                      {reg.depositAmount && reg.depositAmount > 0
                        ? `${formatCurrency(reg.depositAmount)} (${reg.depositAccountName || 'Cuenta'})`
                        : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {reg.cashLeftInDrawer !== null ? formatCurrency(reg.cashLeftInDrawer) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-md inline-block ${
                          reg.status === 'OPEN'
                            ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {reg.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(reg.openedAt).toLocaleString('es-ES', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    {canForceClose && (
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {reg.status === 'OPEN' && (
                          <button
                            onClick={() => openForceCloseModal(reg)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 font-semibold border border-red-200 dark:border-red-500/30 px-2 py-1 rounded-md text-xs hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            Forzar Cierre
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CIERRE FORZOSO */}
      {forceCloseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={24} />
                <h2 className="text-xl font-bold">Forzar Cierre de Caja</h2>
              </div>
              <button
                onClick={() => setForceCloseTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              Cajero:{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {forceCloseTarget.userName}
              </span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Monto Esperado en Sistema:{' '}
              <span className="font-bold">
                {formatCurrency(forceCloseTarget.expectedAmount || 0)}
              </span>
            </p>

            <div className="mb-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Dinero Físico Contado en Cajón
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-2xl font-bold">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={forceCloseAmount}
                  onChange={(e) => setForceCloseAmount(formatInputNumber(e.target.value))}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none text-3xl font-bold"
                  autoFocus
                />
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                ⚠️ Si el monto contado es menor al esperado, la diferencia se descontará del saldo
                del cajero.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => setForceCloseTarget(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleForceClose}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Confirmar Cierre Forzoso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
