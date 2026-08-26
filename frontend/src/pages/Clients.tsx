import { useState, useMemo, useEffect } from 'react';
import { useClients, Client } from '../hooks/useClients';
import { useTreasury } from '../hooks/useTreasury';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/format';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import AdminAuthModal from '../components/AdminAuthModal';
import { playSound } from '../utils/sound';

export default function Clients() {
  const { clients, loading, createClient, updateClient, deleteClient, payDebt } = useClients();
  const { accounts } = useTreasury();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [payingClient, setPayingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', document: '', email: '' });
  const [payData, setPayData] = useState({ amount: '', accountId: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.document?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const currentClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({ name: '', phone: '', document: '', email: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({ name: client.name, phone: client.phone || '', document: client.document || '', email: client.email || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = editingClient 
      ? await updateClient(editingClient.id, formData) 
      : await createClient(formData);
    if (success) {
      playSound('success');
      setIsModalOpen(false);
    } else {
      playSound('error');
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await payDebt(payingClient!.id, parseFormattedNumber(payData.amount), payData.accountId || undefined);
    if (success) {
      playSound('success');
      setPayingClient(null);
      setPayData({ amount: '', accountId: '' });
    } else {
      playSound('error');
    }
  };

  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setAuthModalOpen(true);
  };

  const confirmDelete = async (email: string, password: string) => {
    if (clientToDelete) {
      const success = await deleteClient(clientToDelete, email, password);
      if (success) {
        playSound('success');
        setAuthModalOpen(false);
        setClientToDelete(null);
      } else {
        playSound('error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Gestión de clientes y cuentas por cobrar.</p>
        </div>
        <button onClick={openCreateModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">+ Nuevo Cliente</button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <input 
          type="text" 
          placeholder="Buscar por nombre, documento o teléfono..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Deuda</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8"><Loader /></td></tr>
              ) : currentClients.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No se encontraron clientes.</td></tr>
              ) : (
                currentClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{client.name}</div>
                      <div className="text-xs text-slate-400">{client.document || 'Sin documento'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{client.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-md ${client.balance > 0 ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'}`}>
                        {formatCurrency(client.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {client.balance > 0 && (
                        <button onClick={() => setPayingClient(client)} className="text-green-600 hover:text-green-900 dark:text-green-400 font-medium">Abonar</button>
                      )}
                      <button onClick={() => openEditModal(client)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 font-medium">Editar</button>
                      <button onClick={() => handleDeleteClick(client.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 font-medium">Eliminar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredClients.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Nombre Completo</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Cédula / RIF</label>
                  <input type="text" value={formData.document} onChange={(e) => setFormData({...formData, document: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Teléfono</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Email (Opcional)</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Abonar Deuda</h2>
            <p className="text-sm text-slate-500 mb-6">Cliente: <span className="font-medium text-slate-900 dark:text-white">{payingClient.name}</span></p>
            
            <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-xl mb-6 flex justify-between items-center">
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">Deuda Actual:</span>
              <span className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(payingClient.balance)}</span>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Monto del Abono</label>
                <input type="text" inputMode="numeric" required value={payData.amount} onChange={(e) => setPayData({...payData, amount: formatInputNumber(e.target.value)})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg font-bold" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Recibir en (Cuenta)</label>
                <select value={payData.accountId} onChange={(e) => setPayData({...payData, accountId: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm">
                  <option value="">Caja Actual (Efectivo)</option>
                  {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setPayingClient(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">Registrar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminAuthModal 
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setClientToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar Cliente"
        message="Para eliminar a este cliente, ingresa las credenciales de un Administrador o Gerente."
      />
    </div>
  );
}