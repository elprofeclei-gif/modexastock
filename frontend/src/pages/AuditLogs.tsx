import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { ShieldAlert, Search, Loader2, Globe, Calendar, XCircle } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        // ✅ Ya no enviamos el action al backend, lo filtramos en el frontend
        const res = await axios.get(`/audit?startDate=${startDate}&endDate=${endDate}`);

        // ✅ Filtramos usando el diccionario de traducciones y los detalles
        const filtered = res.data.data.filter((log: any) => {
          // Obtenemos el nombre traducido (ej: "Caja Abierta")
          const readableAction = actionLabels[log.action] || log.action.replace(/_/g, ' ');
          const actionMatch = readableAction.toLowerCase().includes(filterAction.toLowerCase());

          // Buscamos también en los detalles (ej: "Inyección de 500000")
          const detailsMatch = log.details?.toLowerCase().includes(filterAction.toLowerCase());

          // Buscamos por usuario
          const userMatch = log.user?.name.toLowerCase().includes(filterUser.toLowerCase());

          return (actionMatch || detailsMatch) && userMatch;
        });

        setLogs(filtered);
      } catch (error) {
        console.error('Error fetching logs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [filterAction, filterUser, startDate, endDate]); // ✅ Dependencias actualizadas

  // ✅ FUNCIÓN PARA LIMPIAR TODOS LOS FILTROS
  const clearFilters = () => {
    setFilterUser('');
    setFilterAction('');
    setStartDate('');
    setEndDate('');
  };

  // ✅ DICCIONARIO PARA TRADUCIR CÓDIGOS TÉCNICOS A TEXTO CLARO
  const actionLabels: Record<string, string> = {
    CREATE_EXPENSE: 'Gasto Creado',
    CREATE_MANUAL_TRANSACTION: 'Movimiento Tesorería',
    PROCESS_SALE: 'Venta Procesada',
    VOID_SALE: 'Venta Anulada',
    OPEN_CASH_REGISTER: 'Caja Abierta',
    CLOSE_CASH_REGISTER: 'Caja Cerrada',
    FORCE_CLOSE_CASH_REGISTER: 'Cierre Forzoso',
    TRANSFER_TO_CASH_REGISTER: 'Inyección a Caja',
    WITHDRAW_FROM_CASH_REGISTER: 'Retiro de Caja',
    DELETE_PRODUCT: 'Producto Eliminado',
    ADJUST_STOCK: 'Ajuste de Inventario',
    RESET_USER_PASSWORD: 'Clave Restablecida',
    DELETE_USER: 'Usuario Eliminado',
    IMPORT_EXCEL: 'Importación Masiva',
    OPENING_SHORTAGE: 'Faltante de Apertura',
    OPENING_SURPLUS: 'Sobrante de Apertura',
    DOWNLOAD_BACKUP: 'Descarga de Backup',
    SETTLE_USER_BALANCE: 'Cobro de Descuadre',
  };

  const getActionConfig = (action: string) => {
    if (action.includes('DELETE') || action.includes('VOID') || action.includes('FORCE'))
      return {
        color:
          'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/30',
      };
    if (action.includes('ADJUST') || action.includes('CLOSE'))
      return {
        color:
          'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
      };
    if (action.includes('CREATE') || action.includes('OPEN'))
      return {
        color:
          'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/30',
      };
    return {
      color:
        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
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
        {/* ✅ BOTÓN DE BORRAR FILTROS */}
        <div className="flex justify-end mb-3">
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-red-500 font-medium flex items-center gap-1.5 transition-colors"
          >
            <XCircle size={14} /> Borrar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Usuario */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Filtrar por usuario..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
          </div>
          {/* Acción */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Filtrar por acción..."
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value.toLowerCase())}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
          </div>
          {/* Fecha Inicio */}
          <div className="relative">
            <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
          </div>
          {/* Fecha Fin */}
          <div className="relative">
            <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-225 w-full text-sm">
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
                {/* ✅ NUEVA COLUMNA IP */}
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Dirección IP
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="animate-spin inline mr-2" size={18} /> Cargando registros...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No hay registros que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const config = getActionConfig(log.action);
                  // ✅ TRADUCCIÓN DE LA ACCIÓN
                  const readableAction = actionLabels[log.action] || log.action.replace(/_/g, ' ');

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
                          className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-md border ${config.color}`}
                        >
                          {readableAction}
                        </span>
                      </td>
                      {/* ✅ MOSTRAR LA IP */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 mt-1.5">
                        <Globe size={12} className="text-slate-400" />
                        {log.ipAddress || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">
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
