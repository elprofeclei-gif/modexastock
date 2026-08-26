import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { useTreasury } from '../hooks/useTreasury';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/format';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { playSound } from '../utils/sound';
import {
  CheckCircle2,
  Circle,
  FileUp,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Wallet,
  Landmark,
  Receipt,
  Package,
  Users,
  ArrowRight,
  Crown,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, loading } = useReports();
  const { products } = useProducts();
  const { accounts, createTransaction } = useTreasury();
  const { settings, updateSettings } = useSettings();

  const [capitalAmounts, setCapitalAmounts] = useState<Record<string, string>>({});
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    taxId: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    if (settings) {
      setCompanyForm({
        companyName: settings.companyName || '',
        taxId: settings.taxId || '',
        address: settings.address || '',
        phone: settings.phone || '',
      });
    }
  }, [settings]);

  if (user?.role === 'USER') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Bienvenido, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Selecciona una opción para comenzar
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button
            onClick={() => navigate('/pos')}
            className="group p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-indigo-500 transition-all text-left"
          >
            <ShoppingBag className="text-indigo-600 mb-4" size={32} />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Punto de Venta
            </h3>
            <p className="text-slate-500 text-sm">Registra nuevas ventas y cobra.</p>
          </button>
          <button
            onClick={() => navigate('/sales')}
            className="group p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-indigo-500 transition-all text-left"
          >
            <Receipt className="text-green-600 mb-4" size={32} />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Historial de Ventas
            </h3>
            <p className="text-slate-500 text-sm">Consulta tus ventas y tickets.</p>
          </button>
        </div>
      </div>
    );
  }

  const hasInventory = products.length > 0;
  const hasFunds = accounts.reduce((acc, a) => acc + a.balance, 0) > 0;
  const hasCompanyData = settings?.companyName && settings.companyName !== 'Modexastock Store';
  const needsOnboarding = !hasInventory || !hasFunds || !hasCompanyData;

  const handleInjectCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    let injectedAny = false;
    for (const accId in capitalAmounts) {
      const amount = parseFormattedNumber(capitalAmounts[accId]);
      if (amount > 0) {
        await createTransaction({
          accountId: accId,
          amount,
          type: 'DEPOSIT',
          concept: 'Inyección de Capital Inicial',
        });
        injectedAny = true;
      }
    }
    if (injectedAny) {
      playSound('success');
      toast.success('Capital inyectado correctamente.');
      setCapitalAmounts({});
    } else {
      playSound('error');
      toast.error('Debes ingresar al menos un monto mayor a 0.');
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateSettings(companyForm);
    if (success) playSound('success');
    else playSound('error');
  };

  // Componente interno para KPIs minimalistas con variación
  const KpiCard = ({ icon: Icon, label, value, sublabel, variation }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <Icon className="text-slate-400" size={18} />
      </div>
      {loading ? (
        <Loader />
      ) : (
        <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        {variation !== undefined && (
          <div
            className={`flex items-center text-xs font-semibold ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {variation >= 0 ? (
              <TrendingUp size={14} className="mr-1" />
            ) : (
              <TrendingDown size={14} className="mr-1" />
            )}
            {Math.abs(variation).toFixed(1)}%
          </div>
        )}
        {sublabel && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-right">{sublabel}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Resumen financiero y operativo.
        </p>
      </div>

      {/* Onboarding Limpio (Sin Emojis) */}
      {needsOnboarding && !loading && (
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 mb-4 flex items-center gap-2">
            <FileUp size={20} /> Configuración Inicial
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`flex flex-col p-4 bg-white dark:bg-slate-800 rounded-lg ${hasCompanyData ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center space-x-3 mb-3">
                {hasCompanyData ? (
                  <CheckCircle2 className="text-green-500" size={18} />
                ) : (
                  <Circle className="text-slate-300" size={18} />
                )}
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  1. Datos de la Empresa
                </p>
              </div>
              {!hasCompanyData ? (
                <form onSubmit={handleSaveCompany} className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Nombre"
                    value={companyForm.companyName}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, companyName: e.target.value })
                    }
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-md outline-none"
                  />
                  <input
                    type="text"
                    placeholder="NIT"
                    value={companyForm.taxId}
                    onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-md outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dirección"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-md outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-md outline-none"
                  />
                  <button
                    type="submit"
                    className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md font-medium w-full"
                  >
                    Guardar
                  </button>
                </form>
              ) : (
                <div className="text-xs text-green-600 font-medium">Configurado.</div>
              )}
            </div>

            <div
              className={`flex flex-col p-4 bg-white dark:bg-slate-800 rounded-lg ${hasFunds ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center space-x-3 mb-3">
                {hasFunds ? (
                  <CheckCircle2 className="text-green-500" size={18} />
                ) : (
                  <Circle className="text-slate-300" size={18} />
                )}
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  2. Inyectar Capital
                </p>
              </div>
              {!hasFunds && (
                <form onSubmit={handleInjectCapital} className="space-y-2">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="flex items-center gap-2">
                      <label className="text-xs text-slate-500 flex-1 truncate">{acc.name}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={capitalAmounts[acc.id] || ''}
                        onChange={(e) =>
                          setCapitalAmounts({
                            ...capitalAmounts,
                            [acc.id]: formatInputNumber(e.target.value),
                          })
                        }
                        placeholder="0"
                        className="w-24 text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-md outline-none"
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md font-medium w-full mt-2"
                  >
                    Inyectar
                  </button>
                </form>
              )}
            </div>

            <div
              className={`flex flex-col p-4 bg-white dark:bg-slate-800 rounded-lg ${hasInventory ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center space-x-3 mb-3">
                {hasInventory ? (
                  <CheckCircle2 className="text-green-500" size={18} />
                ) : (
                  <Circle className="text-slate-300" size={18} />
                )}
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  3. Cargar Inventario
                </p>
              </div>
              {!hasInventory && (
                <button
                  onClick={() => navigate('/data-center')}
                  className="text-xs px-3 py-2 bg-indigo-600 text-white rounded-md font-medium w-full flex items-center justify-center gap-1"
                >
                  <FileUp size={14} /> Subir Excel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fila 1: KPIs Financieros Minimalistas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          icon={Receipt}
          label="Ventas de Hoy"
          value={formatCurrency(stats?.todaySalesTotal)}
          variation={stats?.salesVariation}
          sublabel={`Ticket: ${formatCurrency(stats?.avgTicket)}`}
        />
        <KpiCard
          icon={Wallet}
          label="Efectivo en Cajas"
          value={formatCurrency(stats?.openCashRegister)}
          sublabel={`${stats?.activeCashiers || 0} cajeros activos`}
        />
        <KpiCard
          icon={Landmark}
          label="Saldo en Bancos"
          value={formatCurrency(stats?.bankBalance)}
          sublabel="Cuentas de Tesorería"
        />
        <KpiCard
          icon={TrendingDown}
          label="Gastos de Hoy"
          value={`-${formatCurrency(stats?.todayExpenses)}`}
          sublabel="Egresos operativos"
        />
      </div>

      {/* Fila 2: KPIs Operativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          icon={Package}
          label="Inventario Registrado"
          value={`${stats?.totalProducts || 0} / ${stats?.totalVariants || 0}`}
          sublabel="Modelos / Variantes"
        />
        <KpiCard
          icon={Package}
          label="Valor Inventario"
          value={formatCurrency(stats?.inventoryValue)}
          sublabel="Precio de venta"
        />
        <KpiCard
          icon={Users}
          label="Cuentas por Cobrar"
          value={formatCurrency(stats?.accountsReceivable)}
          sublabel="Créditos a clientes"
        />
        <KpiCard
          icon={Users}
          label="Comunidad"
          value={`${stats?.totalUsers || 0} / ${stats?.totalClients || 0}`}
          sublabel="Usuarios / Clientes"
        />
      </div>

      {/* Fila 3: Top Productos y Cajeros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Productos */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Crown size={20} className="text-amber-500" /> Top 5 Productos (Hoy)
          </h3>
          <div className="space-y-4">
            {loading ? (
              <Loader />
            ) : stats?.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-slate-400 font-bold w-4">{idx + 1}</span>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <Package size={16} className="text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-500">{p.quantity} unidades vendidas</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                No hay ventas registradas hoy.
              </p>
            )}
          </div>
        </div>

        {/* Cajeros en Turno */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cajeros en Turno</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Cajero
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    N° Ventas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    Efectivo en Caja
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8">
                      <Loader />
                    </td>
                  </tr>
                ) : stats?.cashiersData && stats.cashiersData.length > 0 ? (
                  stats.cashiersData.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {c.name}
                        <p className="text-xs text-slate-400 font-normal">
                          Inicio:{' '}
                          {new Date(c.startTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white text-right">
                        {c.totalSales}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600 text-right font-bold">
                        {formatCurrency(c.cashInDrawer)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                      No hay cajeros activos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fila 4: Alertas Detalladas */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" /> Alertas de Inventario
          </h3>
          <button
            onClick={() => navigate('/inventory', { state: { stockFilter: 'low' } })}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            Ver inventario <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Crítico (≤ 2)</p>
              <p className="text-xl font-bold text-red-600">{stats?.criticalCount || 0}</p>
            </div>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-amber-600 font-medium">Bajo (≤ 10)</p>
              <p className="text-xl font-bold text-amber-600">{stats?.lowCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {loading ? (
            <Loader />
          ) : stats?.lowStockVariants && stats.lowStockVariants.length > 0 ? (
            stats.lowStockVariants.slice(0, 5).map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${v.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}
                  ></span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{v.name}</p>
                    <p className="text-xs text-slate-500">
                      Talla: {v.size} / Color: {v.color}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-bold rounded-md ${v.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}
                >
                  {v.stock} und.
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No hay alertas de inventario.</p>
          )}
        </div>
      </div>
    </div>
  );
}
