import { useState, useMemo, useEffect } from 'react';
import { useClients, Client } from '../hooks/useClients';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/format';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import AdminAuthModal from '../components/AdminAuthModal';
import AddPaymentModal from '../components/AddPaymentModal';
import { playSound } from '../utils/sound';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export default function Clients() {
  const { clients, loading, createClient, updateClient, deleteClient, fetchClients } = useClients();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [payingClient, setPayingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', document: '', email: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyDebtors, setShowOnlyDebtors] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    let tempClients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.document?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (showOnlyDebtors) {
      tempClients = tempClients.filter((c) => c.balance > 0);
    }

    return tempClients;
  }, [clients, searchQuery, showOnlyDebtors]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showOnlyDebtors]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const currentClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({ name: '', phone: '', document: '', email: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || '',
      document: client.document || '',
      email: client.email || '',
    });
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Gestión de clientes y cuentas por cobrar.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      {/* Barra de Herramientas Minimalista */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, documento o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
          />
        </div>
        <button
          onClick={() => setShowOnlyDebtors(!showOnlyDebtors)}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-2 ${
            showOnlyDebtors
              ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30'
              : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Filter size={16} /> {showOnlyDebtors ? 'Mostrando Deudores' : 'Solo Deudores'}
        </button>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-4 text-center font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Estado de Cuenta
                </th>
                <th className="px-6 py-4 text-right font-semibold text-slate-500 uppercase text-xs tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12">
                    <Loader />
                  </td>
                </tr>
              ) : currentClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No se encontraron clientes con los filtros actuales.
                  </td>
                </tr>
              ) : (
                currentClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {client.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {client.document || 'Sin documento'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {client.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {client.balance > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                          <AlertCircle size={12} /> Deuda: {formatCurrency(client.balance)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                          <CheckCircle2 size={12} /> Al día
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {client.balance > 0 && (
                          <button
                            onClick={() => setPayingClient(client)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-500/30 transition-colors"
                          >
                            <Wallet size={12} /> Abonar
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(client)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 transition-colors"
                        >
                          <Edit size={12} /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(client.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 transition-colors"
                        >
                          <Trash2 size={12} /> Eliminar
                        </button>
                      </div>
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

      {/* MODAL CREAR/EDITAR CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Cédula / RIF
                  </label>
                  <input
                    type="text"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO (USANDO EL NUEVO COMPONENTE) */}
      {payingClient && (
        <AddPaymentModal
          client={payingClient}
          onClose={() => setPayingClient(null)}
          onSuccess={() => {
            fetchClients(); // Asegúrate de que useClients exporte fetchClients
          }}
        />
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
