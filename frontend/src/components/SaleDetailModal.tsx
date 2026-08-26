import { Sale } from '../hooks/useSales';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/format';

interface SaleDetailModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export default function SaleDetailModal({ sale, onClose }: SaleDetailModalProps) {
  const settings = useSettings();

  if (!sale) return null;

  const date = new Date(sale.createdAt).toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-700">
        <div className="p-6">
          {/* Cabecera del Ticket con Datos de la Empresa */}
          <div className="text-center mb-6 border-b border-dashed border-slate-200 dark:border-slate-700 pb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {settings?.companyName || 'Modexastock'}
            </h2>
            {settings?.taxId && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{settings.taxId}</p>
            )}
            {settings?.address && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{settings.address}</p>
            )}
            {settings?.phone && (
              <p className="text-xs text-slate-500 dark:text-slate-400">Tel: {settings.phone}</p>
            )}

            <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Ticket de Venta
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Folio: #{sale.id.substring(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-slate-400">{date}</p>
              <p className="text-xs text-slate-400">Cajero: {sale.user?.name || 'N/A'}</p>
            </div>
          </div>

          {/* Tabla de Productos */}
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <th className="text-left pb-2">Producto</th>
                <th className="text-center pb-2">Cant.</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item, index) => (
                <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-2 text-slate-900 dark:text-white">
                    {item.productVariant?.product?.name || 'Producto eliminado'}
                    {item.productVariant?.size?.name && item.productVariant?.color?.name && (
                      <span className="block text-xs text-slate-500">
                        {item.productVariant.size.name} / {item.productVariant.color.name}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-center text-slate-600 dark:text-slate-400">
                    {item.quantity}
                  </td>
                  <td className="py-2 text-right text-slate-900 dark:text-white">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-4 space-y-2">
            {sale.reference && (
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Referencia:</span>
                <span className="font-medium text-slate-900 dark:text-white">{sale.reference}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Método de Pago:</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {sale.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between text-3xl font-extrabold text-slate-900 dark:text-white pt-2">
              <span>Total:</span>
              <span>{formatCurrency(sale.totalAmount)}</span>
            </div>
          </div>

          {/* Botón de Cerrar y Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 mb-4 px-4">
              {settings?.ticketFooter || '¡Gracias por su compra!'}
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
