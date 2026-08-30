import { useState, useRef, useEffect } from 'react';
import { usePOS, CartItem } from '../hooks/usePOS';
import CloseCashModal from '../components/CloseCashModal';
import VariantSelectModal from '../components/VariantSelectModal';
import QuoteModal from '../components/QuoteModal';
import BarcodeScanner from '../components/BarcodeScanner';
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
  ArrowDownToLine,
  FileText,
  Ban,
  UserPlus,
  Loader2,
  User,
  Phone,
  Camera,
  Pause,
  Play,
  Tag,
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
    discount,
    setDiscount,
    subtotal,
    total,
    loading,
    productForVariant,
    setProductForVariant,
    suggestedOpening,
    transferToCashRegister,
    withdrawFromCashRegister,
    toggleWholesale,
    suspendCurrentSale,
    fetchSuspendedSales,
    resumeSuspendedSale,
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [suspendedSales, setSuspendedSales] = useState<any[]>([]);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountInput, setDiscountInput] = useState({ type: 'fixed', value: '' });
  const [splitPayments, setSplitPayments] = useState<any[]>([]);
  const [splitMethod, setSplitMethod] = useState('CASH');
  const [splitAmount, setSplitAmount] = useState('');
  const [splitAccountId, setSplitAccountId] = useState('');
  const [splitReference, setSplitReference] = useState('');

  // BÚSQUEDA PREDICTIVA
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // MODAL CREAR CLIENTE
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', phone: '', document: '' });
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<any[]>([]);
  const [showClientResults, setShowClientResults] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [selectedClientBalance, setSelectedClientBalance] = useState(0);

  // MODALES DE CAJA Y TESORERÍA
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

  // ESTADOS PARA APERTURA DE CAJA FÍSICA
  const [physicalBoxes, setPhysicalBoxes] = useState<any[]>([]);
  const [selectedBox, setSelectedBox] = useState('');
  const [countedOpening, setCountedOpening] = useState('0');

  // NUEVOS ESTADOS PARA AUTORIZACIÓN DE FALTANTE/SOBRANTE EN APERTURA
  const [openingAdminEmail, setOpeningAdminEmail] = useState('');
  const [openingAdminPassword, setOpeningAdminPassword] = useState('');
  const [originAccountId, setOriginAccountId] = useState('');

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
    axios
      .get('/boxes')
      .then((res) => setPhysicalBoxes(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  // BÚSQUEDA PREDICTIVA DE CLIENTES
  useEffect(() => {
    if (clientSearch.trim() === '') {
      setClientResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`/clients/search?query=${encodeURIComponent(clientSearch)}`);
        setClientResults(res.data.data);
        setShowClientResults(true);
      } catch (error) {
        console.error('Error searching clients', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearch]);

  // BÚSQUEDA CON DEBOUNCER
  useEffect(() => {
    if (scannerInput.trim() === '') {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(`/pos/products/search?query=${scannerInput}`);
        setSearchResults(response.data.data);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching products', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [scannerInput]);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSelectProduct(searchResults[0]);
    } else {
      searchAndAddProduct(scannerInput);
    }
    setScannerInput('');
  };

  const handleBarcodeScanned = (code: string) => {
    setScannerInput(code);
    searchAndAddProduct(code);
    setScannerInput('');
    setIsScannerOpen(false);
    inputRef.current?.focus();
  };

  const handleSelectProduct = (product: any) => {
    if (product.variants.length === 1) {
      addToCart(product, product.variants[0]);
    } else {
      setProductForVariant(product);
    }
    setScannerInput('');
    setSearchResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
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

  const handleApplyDiscount = () => {
    const val = parseFormattedNumber(discountInput.value);
    if (discountInput.type === 'percent') {
      const percent = Math.min(Math.max(val, 0), 100); // Entre 0 y 100
      const discountAmount = (subtotal * percent) / 100;
      setDiscount(discountAmount);
    } else {
      if (val > subtotal) {
        toast.error('El descuento no puede ser mayor al total');
        return;
      }
      setDiscount(val);
    }
    setShowDiscountModal(false);
    setDiscountInput({ type: 'fixed', value: '' });
  };

  const received = parseFormattedNumber(receivedAmount);
  // ✅ Calcular cambio para Efectivo normal y para Pago Mixto
  const cashPaid = splitPayments
    .filter((p) => p.method === 'CASH')
    .reduce((acc, p) => acc + p.amount, 0);
  const nonCashPaid = splitPayments
    .filter((p) => p.method !== 'CASH')
    .reduce((acc, p) => acc + p.amount, 0);
  const change =
    paymentMethod === 'CASH'
      ? Math.max(0, received - total)
      : paymentMethod === 'MIXED'
        ? Math.max(0, cashPaid - (total - nonCashPaid))
        : 0;
  const paidAmount = splitPayments.reduce((acc, p) => acc + p.amount, 0);
  const canProcess =
    paymentMethod === 'MIXED'
      ? splitPayments.length > 0 && paidAmount >= total && cart.length > 0
      : paymentMethod === 'CASH'
        ? received >= total && cart.length > 0
        : cart.length > 0;

  const handleProcess = async () => {
    if (paymentMethod === 'CREDIT' && !selectedClient)
      return toast.error('Para venta a crédito, debes seleccionar o crear un cliente.');

    // ✅ Armamos el arreglo de pagos según el método elegido
    let paymentsArray: any[] = [];
    if (paymentMethod === 'MIXED') {
      paymentsArray = splitPayments;
    } else if (paymentMethod === 'CASH') {
      paymentsArray = [{ method: 'CASH', amount: received }];
    } else if (paymentMethod === 'CARD' || paymentMethod === 'TRANSFER') {
      if (!selectedBankAccount) return toast.error('Selecciona la cuenta bancaria');
      paymentsArray = [
        { method: paymentMethod, amount: total, accountId: selectedBankAccount, reference },
      ];
    } else if (paymentMethod === 'CREDIT') {
      paymentsArray = [{ method: 'CREDIT', amount: total }];
    }

    const success = await processSale(paymentsArray, selectedClient, discount);
    if (success) {
      playSound('success');
    } else {
      playSound('error');
    }

    // Limpiar TODO
    setReceivedAmount('');
    setSelectedClient('');
    setSelectedClientName('');
    setSelectedClientBalance(0);
    setReference('');
    setSelectedBankAccount('');
    setDiscount(0);
    setPaymentMethod('CASH');
    setSplitPayments([]); // Limpiar mixto
    setSplitAmount('');
    setSplitReference('');
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('¿Seguro que deseas cancelar esta venta y vaciar el carrito?')) {
      clearCart();
      playSound('error');
      toast.success('Venta cancelada');
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.name) return toast.error('El nombre es obligatorio');
    try {
      const res = await axios.post('/clients', newClientData);
      setClients([...clients, res.data.data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedClient(res.data.data.id);
      setSelectedClientName(res.data.data.name);
      setSelectedClientBalance(0);
      setIsClientModalOpen(false);
      setNewClientData({ name: '', phone: '', document: '' });
      playSound('success');
      toast.success('Cliente creado y seleccionado');
    } catch (error: any) {
      playSound('error');
      toast.error(error.response?.data?.message || 'Error al crear cliente');
    }
  };

  // ✅ FUNCIÓN PARA AGREGAR CEROS AL FINAL
  const handleAppendZeros = (zeros: number) => {
    const currentVal = parseFormattedNumber(receivedAmount);
    if (currentVal === 0) return; // Si el campo está vacío, no hace nada
    const multiplier = zeros === 2 ? 100 : 1000;
    const newVal = currentVal * multiplier;
    setReceivedAmount(formatInputNumber(String(newVal)));
  };

  const handleOpenSuspended = async () => {
    const sales = await fetchSuspendedSales();
    setSuspendedSales(sales);
    setShowSuspendedModal(true);
  };

  const handleResume = async (id: string, items: any[], discountAmount: number) => {
    await resumeSuspendedSale(id, items, discountAmount);
    setShowSuspendedModal(false);
  };

  // --- VISTA DE APERTURA DE CAJA ---
  if (!cashRegister) {
    const selectedBoxData = physicalBoxes.find((b) => b.id === selectedBox);
    const systemBalance = selectedBoxData?.balance || 0;
    const countedAmount = parseFormattedNumber(countedOpening);
    const openingDifference = countedAmount - systemBalance;
    const requiresAuth = Math.abs(openingDifference) > 0;

    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 w-full max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Wallet size={24} className="text-indigo-600" /> Abrir Turno
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              1. Selecciona la Caja Física
            </label>
            <select
              value={selectedBox}
              onChange={(e) => {
                setSelectedBox(e.target.value);
                const box = physicalBoxes.find((b) => b.id === e.target.value);
                setCountedOpening(box ? formatInputNumber(String(box.balance)) : '0');
                setOpeningAdminEmail('');
                setOpeningAdminPassword('');
                setOriginAccountId('');
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg font-semibold"
            >
              <option value="">Selecciona una caja...</option>
              {physicalBoxes.map((box) => (
                <option key={box.id} value={box.id}>
                  {box.name} (Saldo Sistema: ${box.balance.toLocaleString('es-CO')})
                </option>
              ))}
            </select>
          </div>

          {selectedBox && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 mb-2">
                Saldo según el sistema:{' '}
                <span className="font-bold">${systemBalance.toLocaleString('es-CO')}</span>
              </p>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                2. Cuenta el dinero físico en el cajón
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-2xl font-bold">
                  ${' '}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={countedOpening}
                  onChange={(e) => setCountedOpening(formatInputNumber(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-2xl font-bold"
                  autoFocus
                />
              </div>

              {requiresAuth ? (
                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-500/30 space-y-3">
                  <div
                    className={`p-3 rounded-lg ${openingDifference < 0 ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}
                  >
                    <p className="text-sm font-bold">
                      {openingDifference < 0
                        ? `⚠️ Faltante: $${Math.abs(openingDifference).toLocaleString('es-CO')}`
                        : `💰 Sobrante: $${openingDifference.toLocaleString('es-CO')}`}
                    </p>
                    <p className="text-xs mt-1">
                      Requiere autorización del Administrador para justificar el ajuste.
                    </p>
                  </div>

                  <input
                    type="email"
                    placeholder="Email Administrador"
                    value={openingAdminEmail}
                    onChange={(e) => setOpeningAdminEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña Administrador"
                    value={openingAdminPassword}
                    onChange={(e) => setOpeningAdminPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />

                  {openingDifference > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase mb-1.5">
                        ¿De dónde se sacó este dinero? *
                      </label>
                      <select
                        value={originAccountId}
                        onChange={(e) => setOriginAccountId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="">Selecciona el origen...</option>
                        {bankAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} (Saldo: ${acc.balance.toLocaleString('es-CO')})
                          </option>
                        ))}
                        <option value="CAPITAL">Inyección de Capital (Dinero del Dueño)</option>
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✓ El monto contado coincide con el saldo del sistema.
                </p>
              )}
            </div>
          )}

          <button
            onClick={async () => {
              if (!selectedBox) return toast.error('Selecciona una caja física');
              const amount = parseFormattedNumber(countedOpening);
              if (amount < 0) return toast.error('El monto no puede ser negativo');

              if (requiresAuth && (!openingAdminEmail || !openingAdminPassword)) {
                return toast.error(
                  'Debes ingresar credenciales de administrador para justificar el ajuste.'
                );
              }

              if (requiresAuth && openingDifference > 0 && !originAccountId) {
                return toast.error('Debes seleccionar de dónde se sacó el dinero sobrante.');
              }

              const success = await openCashRegister(
                selectedBox,
                amount,
                requiresAuth
                  ? { email: openingAdminEmail, password: openingAdminPassword }
                  : undefined,
                requiresAuth && openingDifference > 0 ? originAccountId : undefined
              );

              if (success) {
                playSound('success');
                setCountedOpening('0');
                setSelectedBox('');
                setOpeningAdminEmail('');
                setOpeningAdminPassword('');
                setOriginAccountId('');
              }
            }}
            disabled={
              !selectedBox ||
              (requiresAuth && (!openingAdminEmail || !openingAdminPassword)) ||
              (requiresAuth && openingDifference > 0 && !originAccountId)
            }
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Wallet size={20} /> Iniciar Turno
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL DEL POS ---
  const paymentMethods = [
    { id: 'CASH', label: 'Efectivo', icon: Banknote },
    { id: 'CARD', label: 'Tarjeta', icon: CreditCard },
    { id: 'TRANSFER', label: 'Transfer.', icon: Send },
    { id: 'CREDIT', label: 'Crédito', icon: UserCheck },
    { id: 'MIXED', label: 'Mixto', icon: Wallet },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)]">
      {/* COLUMNA IZQUIERDA (Carrito y Búsqueda) */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden min-h-0">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="relative flex-1">
            <form onSubmit={handleScanSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={scannerInput}
                  onChange={(e) => setScannerInput(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Escanear o buscar producto..."
                  className="w-full pl-12 pr-4 py-3 text-lg rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors flex items-center justify-center"
                title="Escanear con cámara"
              >
                <Camera size={20} />
              </button>
            </form>

            {showDropdown && (
              <div className="absolute z-30 mt-1 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 flex justify-center items-center text-slate-400">
                    <Loader2 className="animate-spin mr-2" size={18} /> Buscando...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-sm">
                    No se encontraron productos.
                  </div>
                ) : (
                  searchResults.map((p) => (
                    <div
                      key={p.id}
                      onMouseDown={() => handleSelectProduct(p)}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.sku} - {p.brand?.name}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(p.price)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const success = await suspendCurrentSale();
                if (success) playSound('success');
              }}
              disabled={cart.length === 0}
              className="px-4 py-3 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              title="Suspender Venta"
            >
              <Pause size={20} /> <span className="hidden md:inline">Pausar</span>
            </button>

            <button
              onClick={handleOpenSuspended}
              className="px-4 py-3 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl transition-colors flex items-center gap-2"
              title="Recuperar Venta"
            >
              <Play size={20} /> <span className="hidden md:inline">Recuperar</span>
            </button>

            <button
              onClick={handleClearCart}
              disabled={cart.length === 0}
              className="px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Ban size={20} /> <span className="hidden md:inline">Cancelar</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
              <Search size={64} className="mb-4" />
              <p className="text-lg font-medium">Carrito vacío</p>
              <p className="text-sm">Escanea o busca un producto para empezar.</p>
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
      {/* COLUMNA DERECHA (Cobro - Sticky para que no desaparezca) */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
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

        {/* Área de contenido (Métodos de pago, atajos, cliente) - Con scroll si es muy pequeña la pantalla */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* MÉTODOS DE PAGO */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
              Método de Pago
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors ${paymentMethod === method.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                  >
                    <Icon size={18} />
                    <span className="text-[10px] font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* EFECTIVO Y ATAJOS */}
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

              {/* ✅ FILA DE CEROS, BORRAR Y EXACTO */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleAppendZeros(2)}
                  className="py-2 text-sm font-bold bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                  00
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendZeros(3)}
                  className="py-2 text-sm font-bold bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                  000
                </button>
                <button
                  type="button"
                  onClick={() => setReceivedAmount('')}
                  className="py-2 text-sm font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/30"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => setReceivedAmount(formatInputNumber(String(total)))}
                  className="py-2 text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/30"
                >
                  Exacto
                </button>
              </div>
            </div>
          )}

          {/* TARJETA / TRANSFERENCIA */}
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
          {/* PAGO MIXTO */}
          {paymentMethod === 'MIXED' && (
            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-xs font-bold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-xs text-green-600">
                <span>Pagado:</span>
                <span>{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-red-500">
                <span>Pendiente:</span>
                <span>{formatCurrency(Math.max(0, total - paidAmount))}</span>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-1 space-y-2">
                {splitPayments.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs bg-white dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-600"
                  >
                    <span>
                      {p.method} - {formatCurrency(p.amount)}{' '}
                      {p.reference ? `(Ref: ${p.reference})` : ''}
                    </span>
                    <button
                      onClick={() => setSplitPayments(splitPayments.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-600"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* ✅ Si aún hay monto pendiente por pagar, mostramos el formulario. Si ya cubrió el total, lo ocultamos. */}
              {Math.max(0, total - paidAmount) > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={splitMethod}
                      onChange={(e) => setSplitMethod(e.target.value)}
                      className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="CASH">Efectivo</option>
                      <option value="CARD">Tarjeta</option>
                      <option value="TRANSFER">Transfer.</option>
                      <option value="CREDIT">Crédito (Fiar)</option> {/* ✅ AGREGAR ESTO */}
                    </select>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={splitAmount}
                      onChange={(e) => setSplitAmount(formatInputNumber(e.target.value))}
                      placeholder="Monto"
                      className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Antes era {splitMethod !== 'CASH' && (...)} */}
                  {/* ✅ AHORA CAMBIAMOS LA CONDICIÓN A: TARJETA O TRANSFERENCIA */}
                  {(splitMethod === 'CARD' || splitMethod === 'TRANSFER') && (
                    <select
                      value={splitAccountId}
                      onChange={(e) => setSplitAccountId(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">Cuenta...</option>
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* ✅ IGUAL AQUÍ ABAJO */}
                  {(splitMethod === 'CARD' || splitMethod === 'TRANSFER') && (
                    <input
                      type="text"
                      value={splitReference}
                      onChange={(e) => setSplitReference(e.target.value)}
                      placeholder="Referencia"
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  )}

                  <button
                    onClick={() => {
                      const amt = parseFormattedNumber(splitAmount);
                      if (amt <= 0) return toast.error('Ingresa un monto válido');

                      // Validaciones de campos requeridos
                      if (splitMethod === 'CREDIT' && !selectedClient) {
                        return toast.error('Para fiar una parte, debes seleccionar un cliente.');
                      }
                      if (
                        (splitMethod === 'CARD' || splitMethod === 'TRANSFER') &&
                        !splitAccountId
                      ) {
                        return toast.error('Selecciona la cuenta bancaria.');
                      }

                      const pending = total - paidAmount;

                      // ✅ NUEVA LÓGICA DE VALIDACIÓN:
                      // Si es Tarjeta, Transferencia o Crédito, NO puede exceder el pendiente.
                      if (splitMethod !== 'CASH' && amt > pending) {
                        return toast.error(
                          `El monto excede el pendiente (${formatCurrency(pending)})`
                        );
                      }
                      // Si es Efectivo, SÍ puede exceder el pendiente (porque ese excedente es para dar cambio).
                      // Pero si ya cubriste el total, no dejes agregar más efectivo.
                      if (splitMethod === 'CASH' && pending <= 0) {
                        return toast.error('El total ya está cubierto, no agregues más pagos.');
                      }

                      setSplitPayments([
                        ...splitPayments,
                        {
                          method: splitMethod,
                          amount: amt,
                          accountId: splitAccountId,
                          reference: splitReference,
                        },
                      ]);
                      setSplitAmount('');
                      setSplitReference('');
                      setSplitAccountId('');
                    }}
                    className="w-full py-1.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-500/30"
                  >
                    + Agregar Pago
                  </button>
                </>
              ) : (
                /* ✅ Si el total ya está cubierto, mostramos este mensaje y ocultamos el formulario */
                <div className="text-center text-xs text-green-600 font-bold p-2 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/30">
                  ✓ Monto total cubierto
                </div>
              )}
            </div>
          )}

          {/* BUSCADOR DE CLIENTE PREDICTIVO */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase">
                Cliente
              </label>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <UserPlus size={12} /> Nuevo
              </button>
            </div>
            <div className="relative">
              {selectedClient ? (
                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {selectedClientName}
                    </span>
                    {selectedClientBalance > 0 && (
                      <span className="text-[10px] font-semibold text-red-500 dark:text-red-400">
                        Deuda previa: {formatCurrency(selectedClientBalance)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedClient('');
                      setSelectedClientName('');
                      setSelectedClientBalance(0);
                      setClientSearch('');
                    }}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onFocus={() => clientResults.length > 0 && setShowClientResults(true)}
                  onBlur={() => setTimeout(() => setShowClientResults(false), 200)}
                  placeholder="Consumidor Final (Buscar para registrar...)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              )}
              {showClientResults && (
                <div className="absolute z-30 mt-1 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 max-h-48 overflow-y-auto">
                  {clientResults.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs">
                      No se encontraron clientes. Crea uno nuevo.
                    </div>
                  ) : (
                    clientResults.map((c) => (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setSelectedClient(c.id);
                          setSelectedClientName(c.name);
                          setSelectedClientBalance(c.balance);
                          setClientSearch('');
                          setShowClientResults(false);
                        }}
                        className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0"
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {c.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {c.document ? `Doc: ${c.document} | ` : ''}
                          {c.phone ? `Tel: ${c.phone}` : ''}
                          {c.balance > 0 ? ` | Deuda: ${formatCurrency(c.balance)}` : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {paymentMethod === 'CREDIT' && !selectedClient && (
              <p className="text-[10px] text-red-500 mt-1 font-medium">
                * Venta a crédito requiere buscar y seleccionar un cliente.
              </p>
            )}
          </div>
        </div>

        {/* FOOTER FIJO (Total y Botón Cobrar) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
          {/* ✅ RESUMEN DE SUBTOTAL Y DESCUENTO */}
          {discount > 0 && (
            <div className="space-y-1 mb-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium text-red-500">
                <span>Descuento:</span>
                <span>- {formatCurrency(discount)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-slate-500 font-medium">Total</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(total)}
            </span>
          </div>

          {/* ✅ Mostrar cambio si es Efectivo o Mixto */}
          {(paymentMethod === 'CASH' || paymentMethod === 'MIXED') && change > 0 && (
            <div className="flex justify-between items-center text-lg font-bold text-green-600 mb-2">
              <span>Cambio:</span>
              <span>{formatCurrency(change)}</span>
            </div>
          )}

          {/* ✅ BOTÓN DE DESCUENTO Y COBRAR */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowDiscountModal(true)}
              disabled={cart.length === 0}
              className="px-3 py-3 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold rounded-xl transition-colors border border-amber-200 dark:border-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title="Aplicar Descuento"
            >
              <Tag size={20} />
            </button>
            <button
              onClick={handleProcess}
              disabled={loading || !canProcess}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-lg font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
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
      </div>{' '}
      {/* ✅ AQUÍ ESTABA FALTANDO CERRAR LA COLUMNA DERECHA */}
      {/* MODAL CREAR CLIENTE DESDE POS */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-indigo-600" /> Crear Nuevo Cliente
            </h2>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    required
                    value={newClientData.name}
                    onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    autoFocus
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={newClientData.phone}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, phone: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Cédula / RIF
                  </label>
                  <div className="relative">
                    <CreditCard
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={newClientData.document}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, document: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <UserPlus size={16} /> Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL AÑADIR FONDO */}
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
      {/* MODAL RETIRAR FONDO */}
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
      {/* MODAL DE DESCUENTO */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag size={20} className="text-amber-600" /> Aplicar Descuento
              </h3>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDiscountInput({ ...discountInput, type: 'fixed' })}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg ${discountInput.type === 'fixed' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                Monto Fijo ($)
              </button>
              <button
                onClick={() => setDiscountInput({ ...discountInput, type: 'percent' })}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg ${discountInput.type === 'percent' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                Porcentaje (%)
              </button>
            </div>

            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={discountInput.value}
              onChange={(e) =>
                setDiscountInput({ ...discountInput, value: e.target.value.replace(/[^0-9]/g, '') })
              }
              placeholder={discountInput.type === 'fixed' ? 'Ej: 5000' : 'Ej: 10'}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none text-center"
            />

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => {
                  setDiscount(0);
                  setShowDiscountModal(false);
                }}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 text-sm font-medium transition-colors"
              >
                Quitar Descuento
              </button>
              <button
                onClick={handleApplyDiscount}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODALES DE COMPONENTES EXTERNOS */}
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
      {/* MODAL ESCÁNER DE BARRAS */}
      {isScannerOpen && (
        <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setIsScannerOpen(false)} />
      )}
      {/* MODAL DE VENTAS SUSPENDIDAS */}
      {showSuspendedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Play size={20} className="text-indigo-600" /> Ventas Suspendidas
              </h3>
              <button
                onClick={() => setShowSuspendedModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {suspendedSales.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No tienes ventas suspendidas.</p>
              ) : (
                suspendedSales.map((sale) => {
                  // ✅ Leemos el carrito y el descuento del JSON
                  const cartItems = sale.items.cart || [];
                  const saleDiscount = sale.items.discount || 0;
                  const totalAmount =
                    cartItems.reduce((acc: number, item: CartItem) => acc + item.subtotal, 0) -
                    saleDiscount;

                  return (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {cartItems.length} Productos - Total: {formatCurrency(totalAmount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(sale.createdAt).toLocaleString('es-ES', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleResume(sale.id, cartItems, saleDiscount)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                      >
                        <Play size={12} /> Cargar
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
