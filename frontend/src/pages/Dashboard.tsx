import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { useTreasury } from '../hooks/useTreasury';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/format';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { CheckCircle2, Circle, Package, Users, CreditCard, TrendingDown, AlertTriangle, UserCheck, Banknote, Building, FileUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, loading } = useReports();
  const { products } = useProducts();
  const { accounts, createTransaction } = useTreasury();
  const { settings, updateSettings } = useSettings(); // <-- CORREGIDO AQUÍ
  
  const [capitalAmount, setCapitalAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [companyForm, setCompanyForm] = useState({ companyName: '', taxId: '', address: '', phone: '' });

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (settings) {
      setCompanyForm({
        companyName: settings.companyName || '',
        taxId: settings.taxId || '',
        address: settings.address || '',
        phone: settings.phone || ''
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
          <p className="text-slate-500 dark:text-slate-400 text-lg">Selecciona una opción para comenzar</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button onClick={() => navigate('/pos')} className="group p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-indigo-500 transition-all text-left">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 mb-4 text-2xl">🛒</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Punto de Venta</h3>
            <p className="text-slate-500 text-sm">Registra nuevas ventas y cobra.</p>
          </button>
          <button onClick={() => navigate('/sales')} className="group p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-indigo-500 transition-all text-left">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 rounded-xl flex items-center justify-center text-green-600 mb-4 text-2xl">🧾</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Historial de Ventas</h3>
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
    const accId = selectedAccountId || accounts[0]?.id;
    if (!accId) return toast.error('No hay cuentas configuradas. Ve a Tesorería.');
    if (!capitalAmount) return toast.error('Ingresa un monto válido');

    const success = await createTransaction({
      accountId: accId,
      amount: parseFormattedNumber(capitalAmount),
      type: 'DEPOSIT',
      concept: 'Inyección de Capital Inicial'
    });

    if (success) {
      setCapitalAmount('');
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(companyForm);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Resumen financiero y operativo consolidado.</p>
      </div>

      {/* Banner Onboarding Mejorado */}
      {needsOnboarding && !loading && (
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 mb-4">🚀 Configuración Inicial del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* PASO 1: DATOS DE LA EMPRESA */}
            <div className={`flex flex-col p-4 bg-white dark:bg-slate-800 rounded-lg ${hasCompanyData ? 'opacity-50' : ''}`}>
              <div className="flex items-center space-x-3 mb-3">
                {hasCompanyData ? <CheckCircle2 className="text-green-500" size={18} /> : <Circle className="text-slate-300" size={18} />}
                <p className="text-sm font-medium text-slate-900 dark:text-white">1. Datos de la Empresa (Ticket)</p>
              </div>
              {!hasCompanyData ? (
                <form onSubmit={handleSaveCompany} className="space-y-2">
                  <input type="text" required placeholder="Nombre de la tienda" value={companyForm.companyName} onChange={(e) => setCompanyForm({...companyForm, companyName: e.target.value})} className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white rounded-md focus:ring-1 focus:ring-indigo-500 outline-none" />
                  <input type="text" placeholder="NIT / ID Fiscal" value={companyForm.taxId} onChange={(e) => setCompanyForm({...companyForm, taxId: e.target.value})} className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white rounded-md focus:ring-1 focus:ring-indigo-500 outline-none" />
                  <input type="text" placeholder="Dirección" value={companyForm.address} onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})} className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white rounded-md focus:ring-1 focus:ring-indigo-500 outline-none" />
                  <input type="text" placeholder="Teléfono" value={companyForm.phone} onChange={(e) => setCompanyForm({...companyForm, phone: e.target.value})} className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white rounded-md focus:ring-1 focus:ring-indigo-500 outline-none" />
                  <button type="submit" className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium w-full">Guardar Datos</button>
                </form>
              ) : (
                <div className="text-xs text-green-600 font-medium">Configurado correctamente.</div>
              )}
            </div>

            {/* PASO 2: CAPITAL */}
            <div className={`flex flex-col p-4 bg-white dark:bg-slate-800 rounded-lg ${hasFunds ? 'opacity-50' : ''}`}>
              <div className="flex items-center space-x-3 mb-3">
                {hasFunds ? <CheckCircle2 className="text-green-500" size={18} /> : <Circle className="text-slate-300" size={18} />}
                <p className="text-sm font-medium text-slate-900 dark:text-white">2. Inyectar Capital Inicial</p>
              </div>
              {!hasFunds && (
                <form onSubmit={handleInjectCapital} className="space-y-2">
                  <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white rounded-md focus:ring-1 focus:ring-indigo-500 outline-none">
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <input type="text" inputMode="numeric" value={capitalAmount} onChange={(e) => setCapitalAmount(formatInputNumber(e.target.value))} placeholder="Monto $" className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white rounded-md focus:ring-1 focus:ring-indigo-500 outline-none" />
                  <button type="submit" className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium w-full">Inyectar</button>
                </form>
              )}
            </div>

            {/* PASO 3: INVENTARIO */}
            <div className={`flex flex-col p-4 bg-white dark:bg-slate-800 rounded-lg ${hasInventory ? 'opacity-50' : ''}`}>
              <div className="flex items-center space-x-3 mb-3">
                {hasInventory ? <CheckCircle2 className="text-green-500" size={18} /> : <Circle className="text-slate-300" size={18} />}
                <p className="text-sm font-medium text-slate-900 dark:text-white">3. Cargar Inventario</p>
              </div>
              {!hasInventory && (
                <button onClick={() => navigate('/data-center')} className="text-xs px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium w-full flex items-center justify-center gap-1">
                  <FileUp size={14} /> Subir Excel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPIs Fila 1 (Financieros) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-500 font-medium">Ventas de Hoy</p>
            <span className="p-1.5 bg-green-50 dark:bg-green-500/10 rounded-lg text-green-600"><TrendingDown size={16} className="rotate-180"/></span>
          </div>
          {loading ? <Loader /> : <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats?.todaySalesTotal)}</p>}
          <p className="text-xs text-slate-400 mt-1">{stats?.todaySalesCount || 0} transacciones</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-500 font-medium">Efectivo en Cajas</p>
            <span className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600"><Banknote size={16}/></span>
          </div>
          {loading ? <Loader /> : <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats?.openCashRegister)}</p>}
          <p className="text-xs text-slate-400 mt-1">{stats?.activeCashiers || 0} cajeros activos</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-500 font-medium">Saldo en Bancos</p>
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600"><CreditCard size={16}/></span>
          </div>
          {loading ? <Loader /> : <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats?.bankBalance)}</p>}
          <p className="text-xs text-slate-400 mt-1">Cuentas de Tesorería</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-500 font-medium">Gastos de Hoy</p>
            <span className="p-1.5 bg-red-50 dark:bg-red-500/10 rounded-lg text-red-600"><TrendingDown size={16}/></span>
          </div>
          {loading ? <Loader /> : <p className="text-2xl font-bold text-slate-900 dark:text-white">-{formatCurrency(stats?.todayExpenses)}</p>}
          <p className="text-xs text-slate-400 mt-1">Egresos operativos</p>
        </div>
      </div>

      {/* KPIs Fila 2 (Operativos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-500 font-medium">Total Productos</p>
            <span className="p-1.5 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-600"><Package size={16}/></span>
          </div>
          {loading ? <Loader /> : <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.totalProducts || 0}</p>}
          <p className="text-xs text-slate-400 mt-1">SKUs registrados</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-500 font-medium">Valor Inventario</p>
            <span className="p-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600"><Package size={16}/></span>
          </div>
          {loading ? <Loader /> : <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats?.inventoryValue)}</p>}
          <p className="text-xs text-slate-400 mt-1">Precio de venta</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-500 font-medium">Cuentas por Cobrar</p>
            <span className="p-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-600"><Users size={16}/></span>
          </div>
          {loading ? <Loader /> : <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats?.accountsReceivable)}</p>}
          <p className="text-xs text-slate-400 mt-1">Créditos a clientes</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-500 font-medium">Usuarios Sistema</p>
            <span className="p-1.5 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg text-cyan-600"><UserCheck size={16}/></span>
          </div>
          {loading ? <Loader /> : <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.totalUsers || 0}</p>}
          <p className="text-xs text-slate-400 mt-1">{stats?.totalClients || 0} clientes registrados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reporte de Cajeros */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cajeros en Turno</h3>
            <p className="text-sm text-slate-500">Ventas y efectivo esperado por usuario.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cajero</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total Vendido</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Efectivo en Caja</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr><td colSpan={3} className="px-6 py-8"><Loader /></td></tr>
                ) : stats?.cashiersData && stats.cashiersData.length > 0 ? (
                  stats.cashiersData.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{c.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white text-right font-bold">{formatCurrency(c.totalSales)}</td>
                      <td className="px-6 py-4 text-sm text-green-600 text-right font-bold">{formatCurrency(c.cashInDrawer)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">No hay cajeros con caja abierta actualmente.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas de Stock */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Alertas de Inventario</h3>
            <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-xl mb-4 flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={24} />
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Stock Bajo</p>
                {loading ? <Loader /> : <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.lowStockVariants || 0} <span className="text-sm font-normal">variantes</span></p>}
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/inventory', { state: { stockFilter: 'low' } })} 
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors"
          >
            Gestionar Inventario
          </button>
        </div>
      </div>
    </div>
  );
}