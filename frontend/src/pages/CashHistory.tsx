import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format';
import { playSound } from '../utils/sound';
import { Lock, XCircle, Loader2, ArrowDownToLine, Plus, Eye } from 'lucide-react';

export default function CashHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceCloseData, setForceCloseData] = useState<{ id: string; userName: string } | null>(
    null
  );
  const [forceCloseAmount, setForceCloseAmount] = useState('');
  const [isForceClosing, setIsForceClosing] = useState(false);

  // NUEVO: Estado para el modal de detalle de auditoría
  const [detailData, setDetailData] = useState<any | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/pos/cash-register/history');
      setHistory(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleForceClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forceCloseData) return;
    setIsForceClosing(true);
    try {
      const res = await axios.post(`/pos/cash-register/${forceCloseData.id}/force-close`, {
        countedAmount: parseFloat(forceCloseAmount.replace(/[^0-9]/g, '')) || 0,
      });
      toast.success(res.data.message);
      playSound('success');
      setForceCloseData(null);
      setForceCloseAmount('');
      fetchHistory();
    } catch (error: any) {
      playSound('error');
      toast.error(error.response?.data?.message || 'Error al forzar cierre');
    } finally {
      setIsForceClosing(false);
    }
  };

  // Función auxiliar para formatear fechas
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Historial de Cajas (Auditoría)
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1200px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-4 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Cajero
                </th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Caja Física
                </th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Apertura
                </th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Cierre
                </th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Monto Inicial
                </th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Plus size={12} /> Inyecc.
                  </span>
                </th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <ArrowDownToLine size={12} /> Retiros
                  </span>
                </th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Esperado
                </th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Real Contado
                </th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Depósito
                </th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Diferencia
                </th>
                <th className="px-4 py-4 text-right font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="animate-spin inline mr-2" size={18} /> Cargando historial...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-slate-400">
                    No hay registros de caja todavía.
                  </td>
                </tr>
              ) : (
                history.map((reg) => (
                  <tr
                    key={reg.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                      {reg.userName}
                    </td>
                    {/* NUEVA COLUMNA: CAJA FÍSICA - Requiere que tu backend envíe este dato */}
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {reg.physicalBoxName || 'N/A'}
                    </td>
                    {/* NUEVA COLUMNA: FECHA APERTURA */}
                    <td className="px-4 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                      {formatDate(reg.openedAt)}
                    </td>
                    {/* NUEVA COLUMNA: FECHA CIERRE */}
                    <td className="px-4 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                      {reg.closedAt ? formatDate(reg.closedAt) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatCurrency(reg.openingAmount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-green-600 dark:text-green-400">
                      {reg.manualInflows > 0 ? formatCurrency(reg.manualInflows) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-red-600 dark:text-red-400">
                      {reg.manualOutflows > 0 ? formatCurrency(reg.manualOutflows) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {reg.expectedAmount ? formatCurrency(reg.expectedAmount) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {reg.realAmountCounted ? formatCurrency(reg.realAmountCounted) : '-'}
                    </td>
                    {/* NUEVA COLUMNA: DEPÓSITO */}
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {reg.depositAmount > 0 ? (
                        <div className="text-xs">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(reg.depositAmount)}
                          </div>
                          <div className="text-slate-500">{reg.depositAccountName}</div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {reg.status === 'CLOSED' && reg.difference !== null ? (
                        <span
                          className={`font-bold ${reg.difference < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                        >
                          {reg.difference < 0 ? '-' : '+'}
                          {formatCurrency(Math.abs(reg.difference))}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* BOTÓN VER DETALLE */}
                        <button
                          onClick={() => setDetailData(reg)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 transition-colors"
                        >
                          <Eye size={12} /> Detalle
                        </button>

                        {reg.status === 'OPEN' && (
                          <button
                            onClick={() =>
                              setForceCloseData({ id: reg.id, userName: reg.userName })
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 transition-colors"
                          >
                            <Lock size={12} /> Forzar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CIERRE FORZOSO */}
      {forceCloseData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="text-red-600" size={24} />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Forzar Cierre de Caja
              </h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Estás por cerrar forzosamente la caja de{' '}
              <strong className="text-slate-700 dark:text-slate-300">
                {forceCloseData.userName}
              </strong>
              . Cuenta el dinero físico exacto que dejó en el cajón. El descuadre se aplicará
              directamente a su cuenta de usuario.
            </p>
            <form onSubmit={handleForceClose} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Monto contado en el cajón
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-bold">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={forceCloseAmount}
                    onChange={(e) => setForceCloseAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xl font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setForceCloseData(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isForceClosing}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  {isForceClosing ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Lock size={16} />
                  )}
                  Forzar Cierre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE DE AUDITORÍA */}
      {detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Eye className="text-indigo-600" size={24} />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Detalle de Arqueo
                </h2>
              </div>
              <button
                onClick={() => setDetailData(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase mb-1">Cajero</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {detailData.userName}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase mb-1">Apertura</p>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {formatDate(detailData.openedAt)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase mb-1">Cierre</p>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {detailData.closedAt ? formatDate(detailData.closedAt) : 'En curso'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-300">Monto Inicial</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(detailData.openingAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-green-600 dark:text-green-400">
                  + Inyecciones de Efectivo
                </span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(detailData.manualInflows || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-red-600 dark:text-red-400">- Retiros / Gastos</span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(detailData.manualOutflows || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-indigo-50 dark:bg-indigo-500/10 px-3 rounded-lg mt-4">
                <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
                  Total Esperado en Cajón
                </span>
                <span className="font-extrabold text-indigo-700 dark:text-indigo-400 text-lg">
                  {formatCurrency(detailData.expectedAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-slate-100 dark:bg-slate-900 px-3 rounded-lg">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Total Real Contado
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white text-lg">
                  {formatCurrency(detailData.realAmountCounted || 0)}
                </span>
              </div>
              <div
                className={`flex justify-between items-center py-3 px-3 rounded-lg ${detailData.difference < 0 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-green-50 dark:bg-green-500/10'}`}
              >
                <span
                  className={`text-sm font-bold ${detailData.difference < 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}
                >
                  {detailData.difference < 0 ? 'Faltante' : 'Sobrante'}
                </span>
                <span
                  className={`font-extrabold text-lg ${detailData.difference < 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}
                >
                  {formatCurrency(Math.abs(detailData.difference || 0))}
                </span>
              </div>
            </div>

            <div className="mt-6 text-xs text-slate-400 text-center">
              * Para ver el listado detallado de cada venta o retiro individual, revisa el módulo de
              Tesorería o Ventas filtrando por fecha y usuario.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
