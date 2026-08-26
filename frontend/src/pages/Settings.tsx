import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

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

  const handleDeleteItem = async (type: string, id: string) => {
    if (window.confirm('¿Eliminar este registro?')) {
      try {
        await axios.delete(`/settings/catalogs/${type}/${id}`);
        toast.success('Eliminado');
        fetchData();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'No se puede eliminar');
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
          className={`px-6 py-3 text-sm font-medium ${activeTab === 'company' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
        >
          Datos de la Empresa
        </button>
        <button
          onClick={() => setActiveTab('catalogs')}
          className={`px-6 py-3 text-sm font-medium ${activeTab === 'catalogs' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
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

            {/* NUEVO: Mensaje para Cotización */}
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
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700"
                />
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Añadir
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
                        onClick={() =>
                          handleDeleteItem(key.replace('ies', 'y').replace('s', ''), item.id)
                        }
                        className="text-slate-300 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
