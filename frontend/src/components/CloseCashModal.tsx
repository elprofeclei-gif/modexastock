import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/format';

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

export default function CloseCashModal({
  isOpen,
  onClose,
  onConfirm,
  expectedAmount,
}: CloseCashModalProps) {
  const [countedAmount, setCountedAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    if (isOpen) {
      axios
        .get('/treasury/accounts')
        .then((res) =>
          setAccounts(
            res.data.data.filter((acc: any) => acc.type === 'CASH_SAFE' || acc.type === 'BANK')
          )
        )
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

  // AQUÍ ESTÁ EL ARREGLO LÓGICO:
  const expected = expectedAmount || 0;
  const difference = counted - expected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Cerrar Caja (Arqueo)
        </h2>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300">
          Efectivo esperado en caja: <span className="font-bold">{formatCurrency(expected)}</span>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Efectivo Físico Contado ($)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={countedAmount}
            onChange={(e) => setCountedAmount(formatInputNumber(e.target.value))}
            className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 text-xl font-bold focus:ring-blue-500 focus:outline-none"
            placeholder="0"
            autoFocus
          />
          <p
            className={`text-sm mt-1 font-medium ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            Diferencia: {formatCurrency(difference)} ({difference >= 0 ? 'Sobrante' : 'Faltante'})
          </p>
        </div>

        <div className="mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Depositar a Caja Fuerte ($)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={depositAmount}
            onChange={(e) => setDepositAmount(formatInputNumber(e.target.value))}
            className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:outline-none"
            placeholder="0"
          />
          <p className="text-xs text-gray-400 mt-1">
            Deja en caja solo el fondo operativo para mañana.
          </p>
        </div>

        {deposit > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cuenta Destino (Caja Fuerte)
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600"
            >
              <option value="">Selecciona...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
          >
            Cerrar Caja
          </button>
        </div>
      </div>
    </div>
  );
}
