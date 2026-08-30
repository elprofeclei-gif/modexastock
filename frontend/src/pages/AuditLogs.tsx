import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { ShieldAlert, Search, Loader2 } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/audit?action=${filterAction}`);
        setLogs(res.data.data);
      } catch (error) {
        console.error('Error fetching logs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [filterAction]);

  const getActionConfig = (action: string) => {
    if (action.includes('DELETE') || action.includes('VOID') || action.includes('FORCE'))
      return {
        color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
        label: 'Crítico / Eliminación',
      };
    if (action.includes('ADJUST') || action.includes('CLOSE'))
      return {
        color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
        label: 'Ajuste / Modificación',
      };
    if (action.includes('CREATE') || action.includes('OPEN'))
      return {
        color: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
        label: 'Creación / Apertura',
      };
    return {
      color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
      label: action,
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="text-indigo-600" /> Bitácora del Sistema
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Registro inmutable de acciones críticas realizadas por los usuarios.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Filtrar por acción (ej: DELETE, VOID, ADJUST)..."
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value.toUpperCase())}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="animate-spin inline mr-2" size={18} /> Cargando registros...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No hay registros que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const config = getActionConfig(log.action);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {log.user?.name || 'Sistema'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-md ${config.color}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {log.details || 'Sin detalles adicionales'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
