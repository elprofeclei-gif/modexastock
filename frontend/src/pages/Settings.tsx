import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { Trash2, Plus, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<any>({});
  const [catalogs, setCatalogs] = useState<any>({
    categories: [],
    brands: [],
    sizes: [],
    colors: [],
  });
  const [newItem, setNewItem] = useState({ type: 'category', name: '', hex: '#000000' });

  // ✅ ESTADOS UNIFICADOS PARA EL MODAL DE ELIMINAR
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string } | 'CLEANUP' | null>(
    null
  );

  const fetchData = async () => {
    try {
      const [setRes, catRes] = await Promise.all([
        axios.get('/settings'),
        axios.get('/settings/catalogs'),
      ]);
      setSettings(setRes.data.data);
      setCatalogs(catRes.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put('/settings', settings);
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/settings/catalogs', newItem);
      toast.success('Añadido correctamente');
      setNewItem({ ...newItem, name: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error');
    }
  };

  // ✅ FUNCIÓN UNIFICADA QUE EJECUTA EL BORRADO O LA LIMPIEZA
  const confirmDeleteItem = async () => {
    if (itemToDelete === 'CLEANUP') {
      try {
        const res = await axios.delete('/settings/catalogs/cleanup');
        toast.success(res.data.message);
        fetchData();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error al limpiar');
      } finally {
        setShowDeleteModal(false);
        setItemToDelete(null);
      }
      return;
    }

    if (itemToDelete) {
      try {
        await axios.delete(`/settings/catalogs/${itemToDelete.type}/${itemToDelete.id}`);
        toast.success('Eliminado / Desactivado');
        fetchData();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'No se puede eliminar');
      } finally {
        setShowDeleteModal(false);
        setItemToDelete(null);
      }
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Personaliza tu sistema, tickets y catálogos.
        </p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'company' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Datos de la Empresa
        </button>
        <button
          onClick={() => setActiveTab('catalogs')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'catalogs' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Catálogos
        </button>
      </div>

      {activeTab === 'company' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 max-w-2xl space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              value={settings.companyName || ''}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                NIT / ID Fiscal
              </label>
              <input
                type="text"
                value={settings.taxId || ''}
                onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Teléfono
              </label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
              Dirección
            </label>
            <input
              type="text"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Mensaje para Ticket de Venta
              </label>
              <input
                type="text"
                value={settings.ticketFooter || ''}
                onChange={(e) => setSettings({ ...settings, ticketFooter: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Mensaje para Cotización
              </label>
              <input
                type="text"
                value={settings.quoteFooter || ''}
                onChange={(e) => setSettings({ ...settings, quoteFooter: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Margen Detal (%)
              </label>
              <input
                type="number"
                value={settings.retailMargin || 50}
                onChange={(e) => setSettings({ ...settings, retailMargin: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Margen Mayor (%)
              </label>
              <input
                type="number"
                value={settings.wholesaleMargin || 20}
                onChange={(e) => setSettings({ ...settings, wholesaleMargin: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      )}

      {activeTab === 'catalogs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-fit">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Añadir Nuevo</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <select
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              >
                <option value="category">Categoría</option>
                <option value="brand">Marca</option>
                <option value="size">Talla</option>
                <option value="color">Color</option>
              </select>
              <input
                type="text"
                required
                placeholder="Nombre"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              />
              {newItem.type === 'color' && (
                <input
                  type="color"
                  value={newItem.hex}
                  onChange={(e) => setNewItem({ ...newItem, hex: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                />
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Añadir
              </button>
            </form>
          </div>

          <div className="space-y-6">
            {Object.entries(catalogs).map(([key, items]: [string, any]) => (
              <div
                key={key}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"
              >
                <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">
                  {key === 'categories'
                    ? 'Categorías'
                    : key === 'brands'
                      ? 'Marcas'
                      : key === 'sizes'
                        ? 'Tallas'
                        : 'Colores'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700"
                    >
                      {key === 'colors' && (
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.hex }}
                        ></span>
                      )}
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {item.name}
                      </span>
                      <button
                        onClick={() => {
                          setItemToDelete({
                            type: key.replace('ies', 'y').replace('s', ''),
                            id: item.id,
                          });
                          setShowDeleteModal(true);
                        }}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* ✅ BOTÓN DE LIMPIEZA MASIVA */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-red-100 dark:border-red-500/20">
              <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">
                Limpieza de Base de Datos
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Elimina automáticamente categorías y marcas que se crearon por error y no tienen
                productos asociados.
              </p>
              <button
                onClick={() => {
                  setItemToDelete('CLEANUP');
                  setShowDeleteModal(true);
                }}
                className="w-full py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold rounded-lg border border-red-200 dark:border-red-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Limpiar Catálogos Vacíos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL DE CONFIRMACIÓN UNIFICADO */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-full">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {itemToDelete === 'CLEANUP' ? 'Confirmar Limpieza' : 'Eliminar Registro'}
                </h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              {itemToDelete === 'CLEANUP'
                ? '¿Deseas eliminar todas las categorías y marcas que no tienen productos asociados?'
                : '¿Estás seguro de que deseas eliminar este registro del catálogo?'}
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteItem}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} /> Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
