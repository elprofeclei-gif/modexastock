import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency, parseFormattedNumber } from '../utils/format';
import { ShieldAlert, ShieldCheck, Loader2, AlertTriangle, Wallet, X } from 'lucide-react';

export default function Settlements() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingUser, setSettlingUser] = useState<any | null>(null);
  const [physicalBoxes, setPhysicalBoxes] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [destinationId, setDestinationId] = useState('');
  const [amount, setAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, boxesRes, accRes] = await Promise.all([
        axios.get('/users/balances'),
        axios.get('/boxes'),
        axios.get('/treasury/accounts')
      ]);
      setUsers(usersRes.data.data);
      setPhysicalBoxes(boxesRes.data.data);
      setBankAccounts(accRes.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);
    try {
      await axios.post(`/users/${settlingUser.id}/settle-balance`, {
        amount: parseFormattedNumber(amount),
        paymentMethod,
        accountId: paymentMethod !== 'CASH' ? destinationId : null,
        physicalBoxId: paymentMethod === 'CASH' ? destinationId : null
      });
      toast.success('Descuadre cobrado con éxito');
      setSettlingUser(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cobrar');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="text-red-600" size={24} /> Gestión de Descuadres
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Cobra a los cajeros el dinero faltante en sus arqueos.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">Cajero</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-500 uppercase text-xs tracking-wider">Deuda / Saldo</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-500 uppercase text-xs tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="animate-spin inline mr-2" size={18} /> Cargando...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-green-500 font-medium">
                    ✓ No hay cajeros con descuadres pendientes. ¡Todo cuadra!
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.balance < 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                          <AlertTriangle size={12} /> Debe Dinero
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                          Tiene Sobrante
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-lg font-bold ${u.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatCurrency(Math.abs(u.balance))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => { 
                          setSettlingUser(u); 
                          setAmount(Math.abs(u.balance).toString()); 
                          setPaymentMethod('CASH'); 
                          setDestinationId(''); 
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 transition-colors"
                      >
                        <Wallet size={12} /> Registrar Pago
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE COBRO */}
      {settlingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Wallet size={20} className="text-indigo-600" /> Cobrar Descuadre
              </h3>
              <button onClick={() => setSettlingUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSettle} className="p-6 space-y-5">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{settlingUser.name}</p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-500">Deuda Actual:</span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(Math.abs(settlingUser.balance))}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Monto Recibido</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-bold">$</span>
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    required 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} 
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    autoFocus 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Método de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setPaymentMethod('CASH'); setDestinationId(''); }} 
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'CASH' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
                  >
                    Efectivo (Caja Física)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setPaymentMethod('BANK'); setDestinationId(''); }} 
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'BANK' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
                  >
                    Banco / Transfer.
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Destino del Dinero *</label>
                <select 
                  required 
                  value={destinationId} 
                  onChange={(e) => setDestinationId(e.target.value)} 
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Selecciona...</option>
                  {paymentMethod === 'CASH' ? (
                    physicalBoxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                  ) : (
                    bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  )}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isPaying} 
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isPaying ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                Confirmar Pago
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}