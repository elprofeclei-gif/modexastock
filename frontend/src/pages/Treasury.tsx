import { useState } from 'react';
import { useTreasury } from '../hooks/useTreasury';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/format';
import { playSound } from '../utils/sound';

export default function Treasury() {
  const { accounts, expenses, categories, transactions, createExpense, createAccount, createCategory, createTransaction } = useTreasury();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('transactions');
  
  const [formData, setFormData] = useState({ amount: '', concept: '', accountId: '', categoryId: '' });
  const [accData, setAccData] = useState({ name: '', type: 'BANK', initialBalance: '0' });
  const [transData, setTransData] = useState({ accountId: '', amount: '', type: 'DEPOSIT', concept: '' });

  const handleAddCategory = async () => {
    const name = window.prompt('Nombre de la nueva categoría de gasto:');
    if (name) await createCategory(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createExpense({
      amount: parseFormattedNumber(formData.amount),
      concept: formData.concept,
      accountId: formData.accountId,
      categoryId: formData.categoryId || null
    });
    if (success) {
      playSound('success');
      setIsModalOpen(false);
      setFormData({ amount: '', concept: '', accountId: '', categoryId: '' });
    } else {
      playSound('error');
    }
  };

  const handleAccSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createAccount(accData.name, accData.type, parseFormattedNumber(accData.initialBalance));
    if (success) {
      playSound('success');
      setIsAccModalOpen(false);
      setAccData({ name: '', type: 'BANK', initialBalance: '0' });
    } else {
      playSound('error');
    }
  };

  const handleSubmitTrans = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createTransaction({
      accountId: transData.accountId,
      amount: parseFormattedNumber(transData.amount),
      type: transData.type,
      concept: transData.concept
    });
    if (success) {
      playSound('success');
      setIsTransModalOpen(false);
      setTransData({ accountId: '', amount: '', type: 'DEPOSIT', concept: '' });
    } else {
      playSound('error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tesorería</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Gestión de cuentas, caja fuerte y egresos.</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setIsAccModalOpen(true)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors">+ Cuenta</button>
          <button onClick={() => setIsTransModalOpen(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">+ Ingresar/Retirar</button>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">+ Registrar Gasto</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {accounts.map((acc) => (
          <div key={acc.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{acc.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${acc.type === 'BANK' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                {acc.type === 'BANK' ? 'Banco' : 'Caja Fuerte'}
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(acc.balance)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-700">
          <button onClick={() => setActiveTab('transactions')} className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'transactions' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Movimientos de Cuentas</button>
          <button onClick={() => setActiveTab('expenses')} className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'expenses' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Gastos Operativos</button>
        </div>

        {activeTab === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cuenta</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Monto</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                {transactions.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No hay movimientos en cuentas.</td></tr>
                ) : (
                  transactions.map((trans) => (
                    <tr key={trans.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{new Date(trans.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{trans.concept}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{trans.account.name}</td>
                      <td className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${trans.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                        {trans.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(trans.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Monto</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                {expenses.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No hay gastos registrados.</td></tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{exp.concept}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{exp.category?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-red-600 text-right whitespace-nowrap">-{formatCurrency(exp.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Gasto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Registrar Gasto</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Concepto</label>
                <input type="text" required value={formData.concept} onChange={(e) => setFormData({...formData, concept: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" placeholder="Ej: Pago de arriendo" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Monto</label>
                <input type="text" inputMode="numeric" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: formatInputNumber(e.target.value)})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg font-bold" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Cuenta de Pago</label>
                <select required value={formData.accountId} onChange={(e) => setFormData({...formData, accountId: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm">
                  <option value="">Selecciona...</option>
                  {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>)}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Categoría</label>
                  <button type="button" onClick={handleAddCategory} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Nueva</button>
                </div>
                <select value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm">
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">Guardar Gasto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transacción Manual */}
      {isTransModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Movimiento de Cuenta</h2>
            <p className="text-sm text-slate-500 mb-6">Registra préstamos, inversiones de capital o retiros de socios.</p>
            <form onSubmit={handleSubmitTrans} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setTransData({...transData, type: 'DEPOSIT'})} className={`py-2 text-sm font-medium rounded-lg transition-colors ${transData.type === 'DEPOSIT' ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}>Ingreso (Préstamo/Capital)</button>
                  <button type="button" onClick={() => setTransData({...transData, type: 'WITHDRAWAL'})} className={`py-2 text-sm font-medium rounded-lg transition-colors ${transData.type === 'WITHDRAWAL' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}>Retiro (Préstamo a socio)</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Cuenta</label>
                <select required value={transData.accountId} onChange={(e) => setTransData({...transData, accountId: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm">
                  <option value="">Selecciona cuenta...</option>
                  {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Concepto</label>
                <input type="text" required value={transData.concept} onChange={(e) => setTransData({...transData, concept: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" placeholder="Ej: Préstamo bancario, Inversión socio, etc." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Monto</label>
                <input type="text" inputMode="numeric" required value={transData.amount} onChange={(e) => setTransData({...transData, amount: formatInputNumber(e.target.value)})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg font-bold" placeholder="0" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsTransModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cuenta */}
      {isAccModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Nueva Cuenta</h2>
            <form onSubmit={handleAccSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Nombre</label>
                <input type="text" required value={accData.name} onChange={(e) => setAccData({...accData, name: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" placeholder="Ej: Banco de Occidente" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Tipo</label>
                <select value={accData.type} onChange={(e) => setAccData({...accData, type: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm">
                  <option value="BANK">Banco</option>
                  <option value="CASH_SAFE">Caja Fuerte</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Saldo Inicial</label>
                <input type="text" inputMode="numeric" required value={accData.initialBalance} onChange={(e) => setAccData({...accData, initialBalance: formatInputNumber(e.target.value)})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg font-bold" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsAccModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">Crear Cuenta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}