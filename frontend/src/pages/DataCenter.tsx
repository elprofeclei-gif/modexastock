import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { Building, FileUp, Database, FileDown, Package, Loader2 } from 'lucide-react';
import { playSound } from '../utils/sound';

export default function DataCenter() {
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/data/import/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.data.message);
      playSound('success'); // <-- SONIDO DE ÉXITO

      setTimeout(() => {
        navigate('/inventory');
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al importar archivo');
      playSound('error'); // <-- SONIDO DE ERROR
      setUploading(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const response = await axios.get('/data/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `modexastock_backup_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Backup descargado correctamente');
    } catch (error) {
      toast.error('Error al descargar backup');
    }
  };

  const handleDownloadFile = async (endpoint: string, filename: string) => {
    try {
      const response = await axios.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte descargado');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al descargar reporte');
    }
  };

    const downloadTemplate = () => {
    const headers = ['sku', 'nombre', 'descripcion', 'categoria', 'marca', 'talla', 'color', 'costo', 'precio', 'stock', 'stock_minimo'];
    const example1 = [
      'MOD-001',
      'Camiseta Algodón',
      'Camiseta cuello redondo 100% algodón',
      'Ropa',
      'Nike',
      'M',
      'Negro',
      '15000',
      '25000',
      '50',
      '5'
    ];

    const csv = [headers.join(','), example1.join(',')].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_productos.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 relative">
      {/* OVERLAY DE CARGA A PANTALLA COMPLETA */}
      {uploading && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
          <Loader2 size={64} className="animate-spin mb-6 text-indigo-400" />
          <h2 className="text-2xl font-bold mb-2 text-center">Procesando Archivo...</h2>
          <p className="text-slate-300 max-w-md text-center">
            El sistema está guardando tus productos en la base de datos. Esto puede tardar unos
            segundos dependiendo de la cantidad de registros.
          </p>
          <p className="text-slate-500 mt-4 text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
            Por favor, no cierres ni actualices esta página.
          </p>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Centro de Datos</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Gestión masiva de información, reportes y respaldos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Configurar Empresa */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 mb-4">
            <Building size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Datos de la Empresa
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">
            Configura el nombre, NIT y dirección que saldrán impresos en los tickets de venta.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="w-full py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors mt-auto flex items-center justify-center gap-2"
          >
            <Building size={16} /> Ir a Configuración
          </button>
        </div>

        {/* Importar Excel */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
            <FileUp size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Importar Productos
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">
            Sube un archivo Excel o CSV para crear o actualizar el stock masivamente.
          </p>

          <button
            onClick={downloadTemplate}
            disabled={uploading}
            className="w-full py-2 mb-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 dark:border-indigo-500/30 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FileDown size={16} /> Descargar Plantilla
          </button>

          <label
            className={`w-full py-2 ${uploading ? 'bg-slate-400 cursor-not-allowed pointer-events-none' : 'bg-indigo-600 hover:bg-indigo-700'} text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-2`}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Package size={16} /> Seleccionar Archivo
              </>
            )}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Copia de Seguridad */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 rounded-xl flex items-center justify-center text-green-600 mb-4">
            <Database size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Copia de Seguridad
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">
            Descarga un archivo JSON con toda la base de datos para respaldo.
          </p>
          <button
            onClick={handleDownloadBackup}
            className="w-full py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors mt-auto flex items-center justify-center gap-2"
          >
            <Database size={16} /> Descargar Backup (.json)
          </button>
        </div>

        {/* Reporte Inventario */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 mb-4">
            <FileDown size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Reporte Inventario
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">
            Exporta el estado actual del inventario desglosado por variante.
          </p>
          <button
            onClick={() => handleDownloadFile('/data/reports/inventory', 'reporte_inventario.csv')}
            className="w-full py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors mt-auto flex items-center justify-center gap-2"
          >
            <FileDown size={16} /> Exportar Inventario
          </button>
        </div>

        {/* Reporte Ventas */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 mb-4">
            <FileDown size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Reporte Ventas</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">
            Exporta todas las ventas con cajero, método de pago y totales.
          </p>
          <button
            onClick={() => handleDownloadFile('/data/reports/sales', 'reporte_ventas.csv')}
            className="w-full py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors mt-auto flex items-center justify-center gap-2"
          >
            <FileDown size={16} /> Exportar Ventas
          </button>
        </div>
      </div>
    </div>
  );
}
