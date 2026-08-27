import { Sale } from '../hooks/useSales';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/format';
import { X, Printer, Share2, CheckCircle } from 'lucide-react';

interface SaleDetailModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export default function SaleDetailModal({ sale, onClose }: SaleDetailModalProps) {
  const { settings } = useSettings();

  if (!sale) return null;

  const date = new Date(sale.createdAt).toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  // Lógica para imprimir solo el ticket
  const handlePrint = () => {
    window.print();
  };

  // Lógica para compartir (móvil o web)
  const handleShare = async () => {
    const shareData = {
      title: `Ticket Modexastock #${sale.id.substring(0, 8)}`,
      text: `Ticket de venta. Total: ${formatCurrency(sale.totalAmount)}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error al compartir:', err);
      }
    } else {
      handlePrint(); // Si no hay API de compartir, abre el diálogo de imprimir
    }
  };

  // Mensaje dinámico según pago
  const getFooterMessage = () => {
    switch (sale.paymentMethod) {
      case 'CREDIT':
        return 'Gracias por su compra. Pago registrado a crédito.';
      case 'TRANSFER':
        return 'Gracias por su compra. Transferencia confirmada.';
      case 'CARD':
        return 'Gracias por su compra. Pago con tarjeta aprobado.';
      default:
        return settings?.ticketFooter || '¡Gracias por su compra! Vuelva pronto.';
    }
  };

  return (
    <>
      {/* Estilos para imprimir solo el ticket */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-ticket, #printable-ticket * { visibility: visible; }
          #printable-ticket { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-700 relative flex flex-col">
          
          {/* Cabecera del Modal con botón cerrar */}
          <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700 no-print">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Detalle de Venta</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={24} />
            </button>
          </div>

          {/* Área imprimible del Ticket */}
          <div className="p-6 flex-grow" id="printable-ticket">
            <div className="text-center mb-6 border-b border-dashed border-slate-200 dark:border-slate-700 pb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {settings?.companyName || 'Modexastock'}
              </h2>
              {settings?.taxId && <p className="text-xs text-slate-500 mt-1">{settings.taxId}</p>}
              {settings?.address && <p className="text-xs text-slate-500">{settings.address}</p>}
              {settings?.phone && <p className="text-xs text-slate-500">Tel: {settings.phone}</p>}
              
              <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ticket de Venta</p>
                <p className="text-xs text-slate-400 mt-1">Folio: #{sale.id.substring(0, 8).toUpperCase()}</p>
                <p className="text-xs text-slate-400">{date}</p>
                <p className="text-xs text-slate-400">Cajero: {sale.user?.name || 'N/A'}</p>
              </div>
            </div>

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
                    <td className="py-2 text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                    <td className="py-2 text-right text-slate-900 dark:text-white">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-4 space-y-2">
              {sale.reference && (
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>Referencia:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{sale.reference}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Método de Pago:</span>
                <span className="font-medium text-slate-900 dark:text-white">{sale.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-3xl font-extrabold text-slate-900 dark:text-white pt-2">
                <span>Total:</span>
                <span>{formatCurrency(sale.totalAmount)}</span>
              </div>
            </div>

            {/* Mensaje Dinámico de Pago */}
            <div className="mt-8 text-center flex flex-col items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 px-4">
                {getFooterMessage()}
              </p>
            </div>
          </div>

          {/* Footer del Modal con acciones */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex space-x-3 no-print bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
            <button
              onClick={handleShare}
              className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Share2 size={18} /> Compartir
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={18} /> Imprimir / PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}