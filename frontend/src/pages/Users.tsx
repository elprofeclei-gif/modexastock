import { useState, useMemo, useEffect } from 'react';
import { useUsers, User } from '../hooks/useUsers';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import AdminAuthModal from '../components/AdminAuthModal';
import { playSound } from '../utils/sound';
import toast from 'react-hot-toast';
import { Plus, ShieldCheck, Edit, Trash2, Power, Save, Wallet } from 'lucide-react';
// ✅ AGREGA ESTAS DOS LÍNEAS:
import axios from '../api/axios';
import { formatCurrency, parseFormattedNumber } from '../utils/format';

export default function Users() {
  const {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    toggleStatus,
    resetUserPassword,
    settleBalance,
  } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [submitting, setSubmitting] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [settlingUser, setSettlingUser] = useState<User | null>(null);
  const [settleAmount, setSettleAmount] = useState('0');
  const [settleMethod, setSettleMethod] = useState('CASH');
  const [settleAccountId, setSettleAccountId] = useState('');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const handleResetClick = (id: string) => {
    setUserToReset(id);
    setNewPassword('');
    setResetModalOpen(true);
  };
  // Cargar cuentas bancarias al abrir el modal
  useEffect(() => {
    if (settlingUser) {
      axios
        .get('/treasury/accounts')
        .then((res) => setBankAccounts(res.data.data))
        .catch(console.error);
    }
  }, [settlingUser]);

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingUser) return;
    const success = await settleBalance(
      settlingUser.id,
      parseFormattedNumber(settleAmount),
      settleMethod,
      settleMethod !== 'CASH' ? settleAccountId : undefined,
      settleMethod === 'CASH' ? 'CAJA_PRINCIPAL' : undefined // O el ID de la caja física si lo tienes
    );
    if (success) {
      setSettlingUser(null);
      setSettleAmount('0');
    }
  };

  const confirmResetPassword = async () => {
    if (userToReset && newPassword.length >= 6) {
      const success = await resetUserPassword(userToReset, newPassword);
      if (success) {
        playSound('success');
        setResetModalOpen(false);
        setUserToReset(null);
      } else {
        playSound('error');
      }
    } else {
      toast.error('La contraseña debe tener al menos 6 caracteres');
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'USER' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const success = editingUser
      ? await updateUser(editingUser.id, {
          name: formData.name,
          role: formData.role,
          email: formData.email,
        })
      : await createUser(formData);

    if (success) {
      playSound('success');
      setIsModalOpen(false);
    } else {
      playSound('error');
    }
    setSubmitting(false);
  };

  const handleToggleStatus = async (id: string) => {
    const success = await toggleStatus(id);
    if (success) playSound('success');
    else playSound('error');
  };

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setAuthModalOpen(true);
  };

  const confirmDelete = async (email: string, password: string) => {
    if (userToDelete) {
      const success = await deleteUser(userToDelete, email, password);
      if (success) {
        playSound('success');
        setAuthModalOpen(false);
        setUserToDelete(null);
      } else {
        playSound('error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Usuarios</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Crea y administra los accesos al sistema.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                {/* ✅ NUEVA COLUMNA */}
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Descuadre
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8">
                    <Loader />
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No hay usuarios.
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    {/* 1. Nombre */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {user.name}
                    </td>
                    {/* 2. Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.email}
                    </td>
                    {/* 3. Rol */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-md inline-block ${user.role === 'ADMIN' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : user.role === 'MANAGER' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    {/* 4. Estado */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-md inline-block ${user.isActive ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* ✅ 5. NUEVA CELDA DE DESCUADRE */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.balance < 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-bold text-xs">
                          Faltan: {formatCurrency(Math.abs(user.balance))}
                        </span>
                      ) : user.balance > 0 ? (
                        <span className="text-green-600 dark:text-green-400 font-bold text-xs">
                          Sobrante: {formatCurrency(user.balance)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Cuadrado</span>
                      )}
                    </td>

                    {/* 6. Acciones (Aquí están todos los botones) */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 inline-flex items-center gap-1"
                      >
                        <Edit size={14} /> Editar
                      </button>
                      <button
                        onClick={() => handleResetClick(user.id)}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 inline-flex items-center gap-1"
                        title="Restablecer contraseña"
                      >
                        <ShieldCheck size={14} /> Reset Clave
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className="text-amber-600 hover:text-amber-900 dark:text-amber-400 inline-flex items-center gap-1"
                      >
                        <Power size={14} /> {user.isActive ? 'Desactivar' : 'Activar'}
                      </button>

                      {/* ✅ BOTÓN COBRAR (Aquí mismo, dentro de Acciones) */}
                      {user.balance < 0 && (
                        <button
                          onClick={() => {
                            setSettlingUser(user);
                            setSettleAmount(Math.abs(user.balance).toString());
                          }}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 inline-flex items-center gap-1"
                          title="Cobrar Faltante"
                        >
                          <Wallet size={14} /> Cobrar
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteClick(user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 inline-flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
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
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
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

              {/* ✅ CAMPO EMAIL SACADO FUERA DEL IF (Siempre visible) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              </div>

              {/* La contraseña solo se pide al crear, no al editar */}
              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Rol
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                >
                  <option value="USER">Cajero (USER)</option>
                  <option value="MANAGER">Gerente (MANAGER)</option>
                  <option value="ADMIN">Administrador (ADMIN)</option>
                </select>
              </div>
              {/* ... botones de abajo ... */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:bg-indigo-400 flex items-center gap-2"
                >
                  {submitting ? (
                    'Guardando...'
                  ) : (
                    <>
                      <Save size={16} /> {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminAuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar Usuario"
        message="Para eliminar a este usuario, ingresa las credenciales de un Administrador."
      />

      {/* MODAL RESETEAR CONTRASEÑA */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Restablecer Contraseña
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Ingresa la nueva contraseña para este usuario. Se recomienda informarle al usuario que
              debe cambiarla luego.
            </p>
            <input
              type="text"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm mb-4"
              placeholder="Nueva contraseña (mín. 6 carácteres)"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmResetPassword}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={16} /> Restablecer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL COBRAR DESCUADRE */}
      {settlingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Wallet className="text-green-600" size={20} /> Cobrar Descuadre
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              El cajero <span className="font-bold">{settlingUser.name}</span> debe pagar{' '}
              {formatCurrency(Math.abs(settlingUser.balance))}. Registra aquí cómo recibió el dinero
              el Administrador.
            </p>
            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Monto Recibido
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Destino del Dinero
                </label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                >
                  <option value="CASH">Efectivo (Caja Física)</option>
                  <option value="TRANSFER">Banco / Cuenta</option>
                </select>
              </div>
              {settleMethod === 'TRANSFER' && (
                <select
                  value={settleAccountId}
                  onChange={(e) => setSettleAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                  required
                >
                  <option value="">Selecciona la cuenta...</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSettlingUser(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <ShieldCheck size={16} /> Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
