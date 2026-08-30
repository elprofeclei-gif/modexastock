import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { formatCurrency } from '../utils/format';
import { Loader2, TrendingUp, TrendingDown, Calculator, Wallet, PiggyBank } from 'lucide-react';

export default function ProfitLoss() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    // Fechas por defecto: Primer día del mes a hoy
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setPeriod({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    });
  }, []);

  useEffect(() => {
    if (period.startDate && period.endDate) {
      fetchReport();
    }
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/reports/profit-loss?startDate=${period.startDate}&endDate=${period.endDate}`
      );
      setData(res.data.data);
    } catch (error) {
      console.error('Error fetching P&L', error);
    } finally {
      setLoading(false);
    }
  };

  const Row = ({ label, value, isBold, isNegative, color }: any) => (
    <div
      className={`flex justify-between items-center py-3 ${isBold ? 'border-t border-slate-200 dark:border-slate-700 mt-2' : ''}`}
    >
      <span
        className={`text-sm ${isBold ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
      >
        {label}
      </span>
      <span
        className={`text-sm ${isBold ? 'text-lg font-extrabold' : 'text-base font-medium'} ${color ? color : isNegative ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}
      >
        {isNegative ? '-' : ''}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="text-indigo-600" /> Utilidades y Rentabilidad
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Estado de Resultados (P&G)
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={period.startDate}
            onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none"
          />
          <input
            type="date"
            value={period.endDate}
            onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tarjetas de Resumen */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Ingresos (Ventas)
            </p>
            <TrendingUp className="text-green-500" size={18} />
          </div>
          {loading ? (
            <Loader2 className="animate-spin text-slate-400" size={20} />
          ) : (
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(data?.totalRevenue || 0)}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Utilidad Bruta</p>
            <Wallet className="text-indigo-500" size={18} />
          </div>
          {loading ? (
            <Loader2 className="animate-spin text-slate-400" size={20} />
          ) : (
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(data?.grossProfit || 0)}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Utilidad Neta</p>
            <PiggyBank className="text-amber-500" size={18} />
          </div>
          {loading ? (
            <Loader2 className="animate-spin text-slate-400" size={20} />
          ) : (
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(data?.netProfit || 0)}
            </p>
          )}
        </div>
      </div>

      {/* Estado de Resultados Detallado */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Desglose Financiero
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            <Row
              label="Ingresos Totales por Ventas"
              value={data?.totalRevenue || 0}
              color="text-green-600 dark:text-green-400"
            />

            <Row
              label="(-) Costo de Mercancía Vendida (COGS)"
              value={data?.totalCOGS || 0}
              isNegative
            />

            <Row
              label="Utilidad Bruta"
              value={data?.grossProfit || 0}
              isBold
              color="text-indigo-600 dark:text-indigo-400"
            />

            <Row label="(-) Gastos Operativos" value={data?.totalExpenses || 0} isNegative />

            <Row
              label="Utilidad Neta"
              value={data?.netProfit || 0}
              isBold
              color={
                data?.netProfit >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }
            />

            {/* Margen de Rentabilidad */}
            <div className="flex justify-between items-center py-4 mt-4 bg-slate-50 dark:bg-slate-900/50 px-4 rounded-xl">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Calculator size={16} /> Margen de Rentabilidad Neta
              </span>
              <span
                className={`text-xl font-extrabold ${data?.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {data?.profitMargin || 0}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
