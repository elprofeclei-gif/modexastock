import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useProducts, Variant } from '../hooks/useProducts';
import { useMeta } from '../hooks/useMeta';
import ProductFormModal from '../components/ProductFormModal';
import AdjustStockModal from '../components/AdjustStockModal'; // ✅ Importado
import KardexModal from '../components/KardexModal'; // ✅ Importado
import { formatCurrency } from '../utils/format';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import axios from '../api/axios'; // ✅ IMPORTADO PARA EXPORTAR
import toast from 'react-hot-toast'; // ✅ IMPORTADO PARA EXPORTAR
import {
  Table2,
  ListTree,
  LayoutGrid,
  ChevronDown,
  Package,
  SlidersHorizontal,
  History,
  Download,
  Loader2,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

export default function Inventory() {
  const { products, loading, error, createProduct, fetchProducts } = useProducts();
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

  // ✅ NUEVOS ESTADOS PARA AUDITORÍA DE INVENTARIO
  const [adjustingVariant, setAdjustingVariant] = useState<{
    variant: Variant;
    productName: string;
  } | null>(null);
  const [kardexVariant, setKardexVariant] = useState<{
    variant: Variant;
    productName: string;
  } | null>(null);

  // ✅ ESTADO PARA EXPORTAR
  const [isExporting, setIsExporting] = useState(false);

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
        matchesStock = totalStock > 0 && !hasLowStock;
      } else if (stockFilter === 'low') {
        matchesStock = hasLowStock;
      } else if (stockFilter === 'out') {
        matchesStock = totalStock === 0;
      }

      return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, brandFilter, stockFilter]);

  const totalVariants = useMemo(
    () => filteredProducts.reduce((acc, p) => acc + p.variants.length, 0),
    [filteredProducts]
  );

  const globalTotalStock = useMemo(
    () =>
      filteredProducts.reduce(
        (acc, p) => acc + p.variants.reduce((vAcc, v) => vAcc + v.stock, 0),
        0
      ),
    [filteredProducts]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, brandFilter, stockFilter, viewMode]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pageTotalStock = useMemo(
    () =>
      currentProducts.reduce(
        (acc, p) => acc + p.variants.reduce((vAcc, v) => vAcc + v.stock, 0),
        0
      ),
    [currentProducts]
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

  // ✅ FUNCIÓN PARA EXPORTAR INVENTARIO
  const handleExportInventory = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get('/reports/inventory/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventario_modexastock.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Inventario exportado correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar inventario');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Gestiona tus productos, stock y auditoría.
          </p>
        </div>
        <div className="flex items-center gap-4">
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

          {/* ✅ BOTONES DE ACCIÓN SUPERIORES */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportInventory}
              disabled={isExporting}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Download size={18} />
              )}
              <span className="hidden md:inline">Exportar Excel</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              + Añadir Producto
            </button>
          </div>
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

      {/* ✅ FILTROS RÁPIDOS COMPACTOS (CHIPS) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStockFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${stockFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
        >
          Todos ({products.length})
        </button>
        <button
          onClick={() => setStockFilter('low')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${stockFilter === 'low' ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'}`}
        >
          <AlertTriangle size={12} /> Bajo Stock (
          {
            products.filter((p) => p.variants.some((v) => v.stock <= v.minStock && v.stock > 0))
              .length
          }
          )
        </button>
        <button
          onClick={() => setStockFilter('out')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${stockFilter === 'out' ? 'bg-red-600 text-white' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30'}`}
        >
          <XCircle size={12} /> Agotado (
          {products.filter((p) => p.variants.reduce((acc, v) => acc + v.stock, 0) === 0).length})
        </button>
      </div>

      {/* VISTA TARJETAS */}
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

                    {/* ✅ Acciones rápidas en tarjetas (Solo si tiene 1 variante) */}
                    {product.variants.length === 1 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                        <button
                          onClick={() =>
                            setAdjustingVariant({
                              variant: product.variants[0],
                              productName: product.name,
                            })
                          }
                          className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 px-2 py-1.5 rounded-md border border-amber-200 dark:border-amber-500/30 transition-colors"
                        >
                          <SlidersHorizontal size={10} /> Ajustar
                        </button>
                        <button
                          onClick={() =>
                            setKardexVariant({
                              variant: product.variants[0],
                              productName: product.name,
                            })
                          }
                          className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-600 transition-colors"
                        >
                          <History size={10} /> Kardex
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VISTA TABLAS (GENERAL Y DETALLADA) */}
      {(viewMode === 'general' || viewMode === 'detailed') && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm divide-y divide-slate-100 dark:divide-slate-700">
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={viewMode === 'detailed' ? 8 : 7} className="px-6 py-8">
                      <Loader />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={viewMode === 'detailed' ? 8 : 7}
                      className="px-6 py-8 text-center text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                ) : currentProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={viewMode === 'detailed' ? 8 : 7}
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
                          className={`${viewMode === 'detailed' ? 'cursor-pointer' : ''} hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors`}
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {viewMode === 'detailed' ? (
                              <span className="text-slate-400 text-xs italic">
                                Click para ver variantes
                              </span>
                            ) : product.variants.length === 1 ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() =>
                                    setAdjustingVariant({
                                      variant: product.variants[0],
                                      productName: product.name,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30 transition-colors"
                                >
                                  <SlidersHorizontal size={12} /> Ajustar
                                </button>
                                <button
                                  onClick={() =>
                                    setKardexVariant({
                                      variant: product.variants[0],
                                      productName: product.name,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                                >
                                  <History size={12} /> Kardex
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Usa vista detallada</span>
                            )}
                          </td>
                        </tr>

                        {/* ✅ FILAS EXPANDIDAS CON FILTRO DE VARIANTES APLICADO */}
                        {viewMode === 'detailed' &&
                          isExpanded &&
                          // Aplicamos el filtro de stock a las variantes individuales
                          product.variants
                            .filter((v: Variant) => {
                              const totalStock = getTotalStock(product.variants);
                              const hasLowStock = v.stock <= v.minStock;

                              if (stockFilter === 'in') return totalStock > 0 && !hasLowStock;
                              if (stockFilter === 'low') return hasLowStock && v.stock > 0;
                              if (stockFilter === 'out') return totalStock === 0;
                              return true; // Si es 'all', muestra todas
                            })
                            .map((v: Variant) => (
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
                                <td className="px-6 py-3 text-xs text-slate-500 font-medium">
                                  {v.size.name} / {v.color.name}
                                </td>
                                <td colSpan={2} className="px-6 py-3 text-xs text-slate-500">
                                  Mínimo: {v.minStock}
                                </td>
                                <td className="px-6 py-3 text-xs">
                                  <span
                                    className={`px-2 py-0.5 inline-flex text-[10px] font-medium rounded ${v.stock <= v.minStock ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}
                                  >
                                    Stock: {v.stock}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() =>
                                        setAdjustingVariant({
                                          variant: v,
                                          productName: product.name,
                                        })
                                      }
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30 transition-colors"
                                    >
                                      <SlidersHorizontal size={12} /> Ajustar
                                    </button>
                                    <button
                                      onClick={() =>
                                        setKardexVariant({ variant: v, productName: product.name })
                                      }
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                                    >
                                      <History size={12} /> Historial
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>

              {!loading && currentProducts.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                  <tr>
                    <td
                      colSpan={viewMode === 'detailed' ? 6 : 5}
                      className="px-6 py-4 text-right text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                    >
                      Total Unidades (Página):
                    </td>
                    <td colSpan={2} className="px-6 py-4 text-left">
                      <span className="px-2.5 py-1 inline-flex text-sm font-bold rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                        {pageTotalStock} unidades
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            extraInfo={`${totalVariants} variantes | ${globalTotalStock} unidades en total`}
          />
        </div>
      )}

      {/* MODALES */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        createProduct={createProduct}
      />

      {adjustingVariant && (
        <AdjustStockModal
          variant={adjustingVariant.variant}
          productName={adjustingVariant.productName}
          onClose={() => setAdjustingVariant(null)}
          onSuccess={() => {
            fetchProducts();
          }}
        />
      )}

      {kardexVariant && (
        <KardexModal
          variantId={kardexVariant.variant.id}
          productName={kardexVariant.productName}
          variantDetails={`${kardexVariant.variant.size.name} / ${kardexVariant.variant.color.name}`}
          onClose={() => setKardexVariant(null)}
        />
      )}
    </div>
  );
}
