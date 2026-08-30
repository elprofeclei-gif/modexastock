import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/format';
import { X, Wallet, Loader2, Banknote, Landmark } from 'lucide-react';

export default function PayVendorModal({
  vendor,
  onClose,
  onSuccess,
}: {
  vendor: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get('/treasury/accounts')
      .then((res) => setBankAccounts(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFormattedNumber(amount);

    if (parsedAmount <= 0) return toast.error('El monto debe ser mayor a 0');
    if (paymentMethod === 'BANK' && !selectedBankAccount)
      return toast.error('Selecciona la cuenta bancaria');

    setLoading(true);
    try {
      await axios.post(`/vendors/${vendor.id}/pay`, {
        amount: parsedAmount,
        paymentMethod,
        accountId: selectedBankAccount,
      });
      toast.success('Pago a proveedor registrado con éxito');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Wallet size={20} className="text-red-600" /> Pagar a Proveedor
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{vendor.name}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-slate-500">Deuda Actual:</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(vendor.balance)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
              Monto a Pagar
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-bold">
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatInputNumber(e.target.value))}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-2xl font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors ${paymentMethod === 'CASH' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
              >
                <Banknote size={18} />
                <span className="text-[10px] font-medium">Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('BANK')}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors ${paymentMethod === 'BANK' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
              >
                <Landmark size={18} />
                <span className="text-[10px] font-medium">Banco</span>
              </button>
            </div>
          </div>

          {paymentMethod === 'BANK' && (
            <select
              value={selectedBankAccount}
              onChange={(e) => setSelectedBankAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              required
            >
              <option value="">Selecciona cuenta origen...</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Wallet size={20} />}
            Registrar Pago
          </button>
        </form>
      </div>
    </div>
  );
}
