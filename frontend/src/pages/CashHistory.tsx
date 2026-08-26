import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { formatCurrency } from '../utils/format';
import Loader from '../components/Loader';

export default function CashHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchHistory();
  }, []);

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
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8">
                    <Loader />
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-slate-400">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
