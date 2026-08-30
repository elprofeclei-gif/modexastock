import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/format';
import { X } from 'lucide-react'; // ✅ Ícono agregado

interface CloseCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    countedAmount: number;
    depositAmount: number;
    depositAccountId: string;
  }) => void;
  expectedAmount?: number;
}

export default function CloseCashModal({ isOpen, onClose, onConfirm, expectedAmount }: CloseCashModalProps) {
  const [countedAmount, setCountedAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    if (isOpen) {
      axios
        .get('/treasury/accounts')
        .then((res) => setAccounts(res.data.data.filter((acc: any) => acc.type === 'CASH_SAFE' || acc.type === 'BANK')))
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      countedAmount: parseFormattedNumber(countedAmount),
      depositAmount: parseFormattedNumber(depositAmount),
      depositAccountId: selectedAccount,
    });
    setCountedAmount('');
    setDepositAmount('');
    setSelectedAccount('');
  };

  const counted = parseFormattedNumber(countedAmount);
  const deposit = parseFormattedNumber(depositAmount);
  const expected = expectedAmount || 0;
  const difference = counted - expected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cerrar Caja (Arqueo)</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
        </div>

        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-700 dark:text-indigo-300 text-sm">
          Efectivo esperado en caja: <span className="font-bold text-base">{formatCurrency(expected)}</span>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Efectivo Físico Contado</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={countedAmount}
              onChange={(e) => setCountedAmount(formatInputNumber(e.target.value))}
              className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="0"
              autoFocus
            />
          </div>
          <p className={`text-sm mt-2 font-semibold ${difference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            Diferencia: {formatCurrency(difference)} ({difference >= 0 ? 'Sobrante' : 'Faltante'})
          </p>
        </div>

        <div className="mb-4 border-t border-slate-100 dark:border-slate-700 pt-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Depositar a Caja Fuerte</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={depositAmount}
              onChange={(e) => setDepositAmount(formatInputNumber(e.target.value))}
              className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="0"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Deja en caja solo el fondo operativo para mañana.</p>
        </div>

        {deposit > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Cuenta Destino</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            >
              <option value="">Selecciona...</option>
              {accounts.map((acc) => (<option key={acc.id} value={acc.id}>{acc.name}</option>))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">Cancelar</button>
          <button onClick={handleConfirm} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">Cerrar Caja</button>
        </div>
      </div>
    </div>
  );
}