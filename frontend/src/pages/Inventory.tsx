import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useProducts, Variant } from '../hooks/useProducts';
import { useMeta } from '../hooks/useMeta';
import ProductFormModal from '../components/ProductFormModal';
import { formatCurrency } from '../utils/format';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import { Table2, ListTree, LayoutGrid, ChevronDown, Package } from 'lucide-react';

export default function Inventory() {
  const { products, loading, error, createProduct } = useProducts();
  const { meta } = useMeta();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  // Estados de Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [stockFilter, setStockFilter] = useState(location.state?.stockFilter || 'all');

  // Estados de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estado para el selector de vistas y expansión de filas
  const [viewMode, setViewMode] = useState<'general' | 'detailed' | 'cards'>('general');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Lógica de Filtrado
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter ? p.category.id === categoryFilter : true;
      const matchesBrand = brandFilter ? p.brand.id === brandFilter : true;

      const totalStock = p.variants.reduce((acc, v) => acc + v.stock, 0);
      const hasLowStock = p.variants.some((v) => v.stock <= v.minStock);

      let matchesStock = true;
      if (stockFilter === 'in') {
        // En stock: Total > 0 y ninguna variante está baja
        matchesStock = totalStock > 0 && !hasLowStock;
      } else if (stockFilter === 'low') {
        // Bajo Stock (Alertas): Cualquier variante que esté baja o agotada (stock <= minStock)
        matchesStock = hasLowStock;
      } else if (stockFilter === 'out') {
        // Agotado: Todas las variantes en 0
        matchesStock = totalStock === 0;
      }

      return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, brandFilter, stockFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, brandFilter, stockFilter, viewMode]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setBrandFilter('');
    setStockFilter('all');
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const getTotalStock = (variants: Variant[]) => variants.reduce((acc, v) => acc + v.stock, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Gestiona tus productos y su stock.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Selector de Vista (Segmented Control) */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('general')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'general' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Vista General"
            >
              <Table2 size={18} />
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'detailed' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Vista Detallada"
            >
              <ListTree size={18} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Vista Tarjetas"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            + Añadir Producto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:col-span-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
        />
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
        >
          <option value="all">Todo el Stock</option>
          <option value="in">En Stock (Ok)</option>
          <option value="low">Bajo Stock (Alertas)</option>
          <option value="out">Totalmente Agotado</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
        >
          <option value="">Todas las Categorías</option>
          {meta?.categories.map((c: { id: string; name: string }) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
          >
            <option value="">Todas las Marcas</option>
            {meta?.brands.map((b: { id: string; name: string }) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            onClick={clearFilters}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
            title="Limpiar filtros"
          >
            ✕
          </button>
        </div>
      </div>

      {/* --- VISTA TARJETAS --- */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {loading ? (
            <div className="col-span-full">
              <Loader />
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="col-span-full text-center py-8 text-slate-400">
              No se encontraron productos.
            </div>
          ) : (
            currentProducts.map((product) => {
              const totalStock = getTotalStock(product.variants);
              const isLow = product.variants.some((v) => v.stock <= v.minStock);
              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col"
                >
                  <div className="aspect-square bg-slate-100 dark:bg-slate-700 relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package size={40} />
                      </div>
                    )}
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 text-[10px] font-bold rounded-full ${totalStock === 0 ? 'bg-red-500 text-white' : isLow ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}
                    >
                      {totalStock} und
                    </span>
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="text-xs text-slate-400 uppercase font-medium">
                      {product.brand.name}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex-1">
                      {product.name}
                    </p>
                    <p className="text-lg font-extrabold text-indigo-600 mt-2">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* --- VISTAS DE TABLA (GENERAL Y DETALLADA) --- */}
      {(viewMode === 'general' || viewMode === 'detailed') && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {viewMode === 'detailed' && <th className="w-10 px-4 py-3"></th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Marca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Stock Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={viewMode === 'detailed' ? 7 : 6} className="px-6 py-8">
                      <Loader />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={viewMode === 'detailed' ? 7 : 6}
                      className="px-6 py-8 text-center text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                ) : currentProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={viewMode === 'detailed' ? 7 : 6}
                      className="px-6 py-8 text-center text-slate-400"
                    >
                      No se encontraron productos con estos filtros.
                    </td>
                  </tr>
                ) : (
                  currentProducts.map((product) => {
                    const totalStock = getTotalStock(product.variants);
                    const isLow = product.variants.some((v) => v.stock <= v.minStock);
                    const isExpanded = expandedRows.includes(product.id);

                    return (
                      <React.Fragment key={product.id}>
                        <tr
                          className={`${viewMode === 'detailed' ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'} transition-colors`}
                          onClick={() => viewMode === 'detailed' && toggleRow(product.id)}
                        >
                          {viewMode === 'detailed' && (
                            <td className="px-4 py-4 text-slate-400">
                              <ChevronDown
                                size={16}
                                className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {product.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {product.category.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {product.brand.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-md ${totalStock === 0 ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : isLow ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'}`}
                            >
                              {totalStock} unidades
                            </span>
                          </td>
                        </tr>

                        {/* Filas expandibles (Solo vista detallada) */}
                        {viewMode === 'detailed' &&
                          isExpanded &&
                          product.variants.map((v: Variant) => (
                            <tr
                              key={v.id}
                              className="bg-slate-50 dark:bg-slate-900/30 border-l-4 border-indigo-200 dark:border-indigo-500/50"
                            >
                              <td
                                colSpan={2}
                                className="px-6 py-3 text-right text-xs text-slate-400 uppercase"
                              >
                                Variante:
                              </td>
                              <td className="px-6 py-3 text-xs text-slate-500">
                                {v.size.name} / {v.color.name}
                              </td>
                              <td colSpan={3} className="px-6 py-3 text-xs text-slate-500">
                                Mínimo: {v.minStock}
                              </td>
                              <td className="px-6 py-3 text-xs">
                                <span
                                  className={`px-2 py-0.5 inline-flex text-[10px] font-medium rounded ${v.stock <= v.minStock ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}
                                >
                                  Stock: {v.stock}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación solo para tablas */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        createProduct={createProduct}
      />
    </div>
  );
}
