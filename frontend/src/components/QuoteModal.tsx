import { useSettings } from '../hooks/useSettings';
import { CartItem } from '../hooks/usePOS';
import { formatCurrency } from '../utils/format';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
}

export default function QuoteModal({ isOpen, onClose, cart, total }: QuoteModalProps) {
  const { settings } = useSettings(); // <-- CORREGIDO AQUÍ

  if (!isOpen) return null;

  const date = new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-700">
        <div className="p-6" id="quote-printable-area">
          {/* Cabecera */}
          <div className="text-center mb-6 border-b border-dashed border-slate-200 dark:border-slate-700 pb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {settings?.companyName || 'Modexastock'}
            </h2>
            {settings?.taxId && <p className="text-xs text-slate-500 mt-1">{settings.taxId}</p>}
            {settings?.address && <p className="text-xs text-slate-500">{settings.address}</p>}
            {settings?.phone && <p className="text-xs text-slate-500">Tel: {settings.phone}</p>}

            <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">COTIZACIÓN</p>
              <p className="text-xs text-slate-400 mt-1">Fecha: {date}</p>
            </div>
          </div>

          {/* Tabla */}
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <th className="text-left pb-2">Producto</th>
                <th className="text-center pb-2">Cant.</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => (
                <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-2 text-slate-900 dark:text-white">
                    {item.name}
                    <span className="block text-xs text-slate-500">
                      {item.size} / {item.color} {item.isWholesale ? '(Mayor)' : ''}
                    </span>
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

          {/* Total */}
          <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-4 space-y-2">
            <div className="flex justify-between text-2xl font-extrabold text-slate-900 dark:text-white">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Footer (Mensaje de Cotización) */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 mb-4 px-4">
              {settings?.quoteFooter || 'Cotización válida por 3 días. Precios sujetos a cambios.'}
            </p>
          </div>
        </div>

        {/* Botones (No se imprimen) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium"
          >
            Cerrar
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Imprimir / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
