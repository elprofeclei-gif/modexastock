import { useState, useRef, useEffect } from 'react';
import { usePOS } from '../hooks/usePOS';
import CloseCashModal from '../components/CloseCashModal';
import VariantSelectModal from '../components/VariantSelectModal';
import QuoteModal from '../components/QuoteModal';
import toast from 'react-hot-toast';
import axios from '../api/axios';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/format';
import { playSound } from '../utils/sound';
import {
  Search,
  Trash2,
  Banknote,
  CreditCard,
  Send,
  UserCheck,
  Wallet,
  XCircle,
  Plus,
  ShieldCheck,
  Lock,
  ArrowDownToLine,
  FileText,
  Ban,
} from 'lucide-react';

export default function POS() {
  const {
    cashRegister,
    openCashRegister,
    closeCashRegister,
    cart,
    searchAndAddProduct,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    processSale,
    total,
    loading,
    productForVariant,
    setProductForVariant,
    suggestedOpening,
    transferToCashRegister,
    withdrawFromCashRegister,
    toggleWholesale,
  } = usePOS();

  const [scannerInput, setScannerInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [openingAmount, setOpeningAmount] = useState('0');
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [reference, setReference] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    accountId: '',
    amount: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawData, setWithdrawData] = useState({
    accountId: '',
    amount: '',
    adminEmail: '',
    adminPassword: '',
    concept: '',
  });
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [cart, cashRegister]);
  useEffect(() => {
    if (suggestedOpening > 0) setOpeningAmount(formatInputNumber(suggestedOpening.toString()));
  }, [suggestedOpening]);
  useEffect(() => {
    axios
      .get('/clients')
      .then((res) => setClients(res.data.data))
      .catch((err) => console.error(err));
    axios
      .get('/treasury/accounts')
      .then((res) => setBankAccounts(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    searchAndAddProduct(scannerInput);
    setScannerInput('');
  };

  const handleCloseCash = async (data: {
    countedAmount: number;
    depositAmount: number;
    depositAccountId: string;
  }) => {
    const summary = await closeCashRegister(
      data.countedAmount,
      data.depositAmount,
      data.depositAccountId
    );
    if (summary) {
      setIsCloseModalOpen(false);
      playSound('success');
      let msg = `Esperado: ${formatCurrency(summary.expectedAmount)} | Contado: ${formatCurrency(summary.realAmount)}\n`;
      msg += `Diferencia: ${summary.difference >= 0 ? 'Sobrante' : 'Faltante'} ${formatCurrency(Math.abs(summary.difference))}`;
      if (summary.requestedDeposit > 0 && summary.amountPaidToCoverShortage > 0) {
        msg += `\n\nAjuste: Se retuvieron ${formatCurrency(summary.amountPaidToCoverShortage)} del depósito para cubrir el faltante.`;
        msg += `\nDepositado real: ${formatCurrency(summary.deposit)}`;
      } else if (summary.deposit > 0) {
        msg += `\nDepositado: ${formatCurrency(summary.deposit)}`;
      }
      msg += `\nQuedó en caja: ${formatCurrency(summary.finalClosingAmount)}`;
      toast.success(msg, { duration: 10000 });
    } else {
      playSound('error');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await transferToCashRegister({
      accountId: transferData.accountId,
      amount: parseFormattedNumber(transferData.amount),
      adminEmail: transferData.adminEmail,
      adminPassword: transferData.adminPassword,
    });
    if (success) {
      playSound('success');
      setIsTransferModalOpen(false);
      setTransferData({ accountId: '', amount: '', adminEmail: '', adminPassword: '' });
    } else {
      playSound('error');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await withdrawFromCashRegister({
      accountId: withdrawData.accountId || undefined,
      amount: parseFormattedNumber(withdrawData.amount),
      adminEmail: withdrawData.adminEmail,
      adminPassword: withdrawData.adminPassword,
      concept: withdrawData.concept,
    });
    if (success) {
      playSound('success');
      setIsWithdrawModalOpen(false);
      setWithdrawData({
        accountId: '',
        amount: '',
        adminEmail: '',
        adminPassword: '',
        concept: '',
      });
    } else {
      playSound('error');
    }
  };

  const received = parseFormattedNumber(receivedAmount);
  const change = paymentMethod === 'CASH' ? Math.max(0, received - total) : 0;
  const canProcess =
    paymentMethod === 'CASH' ? received >= total && cart.length > 0 : cart.length > 0;

  const handleProcess = async () => {
    if (paymentMethod === 'CREDIT' && !selectedClient) return toast.error('Selecciona un cliente');
    if ((paymentMethod === 'CARD' || paymentMethod === 'TRANSFER') && !selectedBankAccount)
      return toast.error('Selecciona la cuenta bancaria');

    const success = await processSale(
      paymentMethod,
      received,
      selectedClient,
      reference,
      selectedBankAccount
    );
    if (success) {
      playSound('success');
    } else {
      playSound('error');
    }
    setReceivedAmount('');
    setSelectedClient('');
    setReference('');
    setSelectedBankAccount('');
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('¿Seguro que deseas cancelar esta venta y vaciar el carrito?')) {
      clearCart();
      playSound('error');
      toast.success('Venta cancelada');
    }
  };

  if (!cashRegister) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 w-full max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Abrir Caja</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            {suggestedOpening > 0
              ? `Saldo base heredado del último cierre. No es modificable.`
              : 'Ingresa el monto inicial en efectivo.'}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const success = await openCashRegister(
                parseFormattedNumber(openingAmount) || suggestedOpening
              );
              if (success) playSound('success');
            }}
          >
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-2xl font-bold">
                $
              </span>
              <input
                type="text"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(formatInputNumber(e.target.value))}
                readOnly={suggestedOpening > 0}
                className={`w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-3xl font-bold ${suggestedOpening > 0 ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-700' : ''}`}
                autoFocus
              />
              {suggestedOpening > 0 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={20} />
                </div>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Wallet size={20} /> Iniciar Turno
            </button>
          </form>
        </div>
      </div>
    );
  }

  const paymentMethods = [
    { id: 'CASH', label: 'Efectivo', icon: Banknote },
    { id: 'CARD', label: 'Tarjeta', icon: CreditCard },
    { id: 'TRANSFER', label: 'Transfer.', icon: Send },
    { id: 'CREDIT', label: 'Crédito', icon: UserCheck },
  ];

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <form onSubmit={handleScan} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={scannerInput}
              onChange={(e) => setScannerInput(e.target.value)}
              placeholder="Escanear o buscar producto..."
              className="w-full pl-12 pr-4 py-3 text-lg rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </form>
          <button
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className="px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Ban size={20} /> <span className="hidden md:inline">Cancelar</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
              <Search size={64} className="mb-4" />
              <p className="text-lg font-medium">Carrito vacío</p>
              <p className="text-sm">Escanea un producto para empezar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.productVariantId}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500">
                        {item.size} / {item.color} - {formatCurrency(item.unitPrice)}
                      </p>
                      <button
                        onClick={() => toggleWholesale(item.productVariantId)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${
                          item.isWholesale
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.isWholesale ? 'Mayor' : 'Detal'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.productVariantId,
                          parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                        )
                      }
                      className="w-12 px-2 py-1 text-center rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <span className="w-24 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.subtotal)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.productVariantId)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white">Cobro</h3>
          <div className="flex items-center gap-3 text-slate-400">
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              disabled={cart.length === 0}
              title="Generar Cotización"
              className="hover:text-slate-700 dark:hover:text-white disabled:opacity-30"
            >
              <FileText size={18} />
            </button>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              title="Añadir Fondo"
              className="hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              title="Retirar Fondo"
              className="hover:text-red-600 dark:hover:text-red-400"
            >
              <ArrowDownToLine size={18} />
            </button>
            <button
              onClick={() => setIsCloseModalOpen(true)}
              title="Cerrar Caja"
              className="hover:text-red-600 dark:hover:text-red-400"
            >
              <XCircle size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
              Método de Pago
            </label>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors ${
                      paymentMethod === method.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-[10px] font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMethod === 'CASH' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Efectivo Recibido
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(formatInputNumber(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="0"
              />
            </div>
          )}

          {(paymentMethod === 'CARD' || paymentMethod === 'TRANSFER') && (
            <div className="space-y-2">
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                placeholder={
                  paymentMethod === 'CARD' ? 'Voucher (4 dígitos)' : 'Cod. Transferencia'
                }
              />
              <select
                value={selectedBankAccount}
                onChange={(e) => setSelectedBankAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              >
                <option value="">Cuenta destino...</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {paymentMethod === 'CREDIT' && (
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            >
              <option value="">Selecciona cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-slate-500 font-medium">Total</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(total)}
            </span>
          </div>

          {paymentMethod === 'CASH' && (
            <div className="flex justify-between items-center text-lg font-bold text-green-600 mb-2">
              <span>Cambio:</span>
              <span>{formatCurrency(change)}</span>
            </div>
          )}

          <button
            onClick={handleProcess}
            disabled={loading || !canProcess}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-lg font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              'Procesando...'
            ) : (
              <>
                <Banknote size={20} /> COBRAR
              </>
            )}
          </button>
        </div>
      </div>

      <CloseCashModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirm={handleCloseCash}
        expectedAmount={cashRegister?.expectedAmount || 0}
      />

      <VariantSelectModal
        product={productForVariant}
        onSelect={(prod, varItem) => addToCart(prod, varItem)}
        onClose={() => setProductForVariant(null)}
      />

      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        cart={cart}
        total={total}
      />

      {/* Modal Añadir Fondo */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="text-indigo-600" size={24} />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Añadir Fondo a Caja
              </h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Requiere autorización de Administrador o Gerente.
            </p>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Origen (Cuenta)
                </label>
                <select
                  required
                  value={transferData.accountId}
                  onChange={(e) => setTransferData({ ...transferData, accountId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                >
                  <option value="">Selecciona cuenta...</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Monto
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={transferData.amount}
                  onChange={(e) =>
                    setTransferData({ ...transferData, amount: formatInputNumber(e.target.value) })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg font-bold"
                  placeholder="0"
                />
              </div>
              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={transferData.adminEmail}
                    onChange={(e) =>
                      setTransferData({ ...transferData, adminEmail: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    placeholder="admin@modexastock.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Contraseña Admin
                  </label>
                  <input
                    type="password"
                    required
                    value={transferData.adminPassword}
                    onChange={(e) =>
                      setTransferData({ ...transferData, adminPassword: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <ShieldCheck size={16} /> Autorizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Retirar Fondo */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownToLine className="text-red-600" size={24} />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Retirar Fondo de Caja
              </h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Requiere autorización. El monto se descontará del arqueo del cajero.
            </p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Destino (Opcional)
                </label>
                <select
                  value={withdrawData.accountId}
                  onChange={(e) => setWithdrawData({ ...withdrawData, accountId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                >
                  <option value="">Efectivo (Gasto directo)</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
              {!withdrawData.accountId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Concepto del Gasto
                  </label>
                  <input
                    type="text"
                    required={!withdrawData.accountId}
                    value={withdrawData.concept}
                    onChange={(e) => setWithdrawData({ ...withdrawData, concept: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                    placeholder="Ej: Pago de servicio, compra urgente..."
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Monto a Retirar
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={withdrawData.amount}
                  onChange={(e) =>
                    setWithdrawData({ ...withdrawData, amount: formatInputNumber(e.target.value) })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none text-lg font-bold"
                  placeholder="0"
                />
              </div>
              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={withdrawData.adminEmail}
                    onChange={(e) =>
                      setWithdrawData({ ...withdrawData, adminEmail: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                    placeholder="admin@modexastock.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Contraseña Admin
                  </label>
                  <input
                    type="password"
                    required
                    value={withdrawData.adminPassword}
                    onChange={(e) =>
                      setWithdrawData({ ...withdrawData, adminPassword: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <ShieldCheck size={16} /> Autorizar Retiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
