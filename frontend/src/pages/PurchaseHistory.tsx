import { useState, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import { formatCurrency } from '../utils/format';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import { Filter } from 'lucide-react';

export default function PurchaseHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [vendorFilter, setVendorFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, venRes] = await Promise.all([
          axios.get('/purchases'),
          axios.get('/vendors')
        ]);
        setHistory(histRes.data.data);
        setVendors(venRes.data.data);
      } catch (error) {
        console.error('Error fetching history', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter(p => {
      const matchesVendor = vendorFilter ? p.vendorId === vendorFilter : true;
      const date = new Date(p.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate + 'T23:59:59') : null;
      const matchesDate = (!start || date >= start) && (!end || date <= end);
      return matchesVendor && matchesDate;
    });
  }, [history, vendorFilter, startDate, endDate]);

  useEffect(() => { setCurrentPage(1); }, [vendorFilter, startDate, endDate]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const currentItems = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clearFilters = () => {
    setVendorFilter(''); setStartDate(''); setEndDate('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Historial de Compras</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Auditoría de entradas de inventario y pagos a proveedores.</p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm">
          <option value="">Todos los Proveedores</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Desde</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Hasta</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
        </div>
        <div className="flex items-end">
          <button onClick={clearFilters} className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <Filter size={16} /> Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Origen del Dinero</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Registrado por</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8"><Loader /></td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No hay compras registradas en este rango.</td></tr>
              ) : (
                currentItems.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(p.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{p.vendor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{p.account ? p.account.name : 'Caja Efectivo'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{p.user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white text-right">{formatCurrency(p.totalAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredHistory.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}