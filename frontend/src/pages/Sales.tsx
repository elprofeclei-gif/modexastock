import { useState, useMemo, useEffect } from 'react';
import { useSales, Sale } from '../hooks/useSales';
import SaleDetailModal from '../components/SaleDetailModal';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import { formatCurrency } from '../utils/format';
import { playSound } from '../utils/sound';
import { Filter, Download, Eye, Search } from 'lucide-react';

export default function Sales() {
  const { sales, loading, fetchSales, filters, setFilters, downloadReport } = useSales();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Debouncer para la búsqueda (espera 500ms después de teclear para buscar)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ ...filters, search: searchInput });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ✅ Ejecutar búsqueda cuando cambian los filtros
  useEffect(() => {
    fetchSales(filters);
    setCurrentPage(1);
  }, [filters.search, filters.startDate, filters.endDate]);

  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const currentSales = sales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ search: '', startDate: '', endDate: '' });
  };

  const handleDownload = async () => {
    const success = await downloadReport();
    if (success) playSound('success');
    else playSound('error');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Historial de Ventas</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Busca y audita transacciones por cliente, fecha o folio.
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Download size={16} /> <span>Exportar CSV</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por cliente o folio..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Desde</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Hasta</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
          </div>
          <button
            onClick={clearFilters}
            className="self-end px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
            title="Limpiar filtros"
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-sm divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Folio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pago</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8"><Loader /></td></tr>
              ) : currentSales.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No hay ventas que coincidan con la búsqueda.</td></tr>
              ) : (
                currentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      #{sale.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(sale.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {sale.client?.name || 'Consumidor Final'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-md inline-block w-fit ${
                        sale.paymentMethod.includes('CASH') ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' :
                        sale.paymentMethod.includes('CREDIT') ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                        sale.paymentMethod.includes('MIXED') ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                        'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white text-right">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 font-medium inline-flex items-center gap-1"
                      >
                        <Eye size={14} /> Ver Ticket
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sales.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
    </div>
  );
}