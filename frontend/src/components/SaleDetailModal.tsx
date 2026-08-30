import { useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { Sale } from '../hooks/useSales'; // Asegúrate de actualizar la interfaz Sale más abajo
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/format';
import { printThermalTicket } from '../utils/printer';
import { sendTicketByWhatsApp } from '../utils/whatsapp'; // ✅ IMPORTADO
import {
  X,
  Printer,
  Share2,
  CheckCircle,
  ShieldCheck,
  Loader2,
  Ban,
  AlertTriangle,
  MessageCircle, // ✅ IMPORTADO
} from 'lucide-react';

interface SaleDetailModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export default function SaleDetailModal({ sale, onClose }: SaleDetailModalProps) {
  const { settings } = useSettings();
  const [showVoidForm, setShowVoidForm] = useState(false);
  const [voidData, setVoidData] = useState({ adminEmail: '', adminPassword: '', reason: '' });
  const [isVoiding, setIsVoiding] = useState(false);

  // ✅ ESTADOS PARA WHATSAPP
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [showWaInput, setShowWaInput] = useState(false);

  if (!sale) return null;

  const date = new Date(sale.createdAt).toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const handlePrint = () => {
    if (sale) {
      printThermalTicket(sale, settings);
    }
  };

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
      handlePrint();
    }
  };

  // ✅ FUNCIÓN PARA ENVIAR WHATSAPP
  const handleSendWhatsApp = () => {
    if (!whatsappPhone || whatsappPhone.length < 7) {
      toast.error('Ingresa un número de teléfono válido');
      return;
    }
    sendTicketByWhatsApp(sale, whatsappPhone, settings?.companyName || 'Modexastock');
    setShowWaInput(false);
    setWhatsappPhone('');
    toast.success('Abriendo WhatsApp...');
  };

  const handleVoidSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVoiding(true);
    try {
      await axios.post(`/sales/${sale.id}/void`, voidData);
      toast.success('Venta anulada con éxito. Inventario y dinero revertidos.');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al anular venta');
    } finally {
      setIsVoiding(false);
    }
  };

  const getFooterMessage = () => {
    if (sale.isVoided) return 'Esta venta fue ANULADA. No tiene validez fiscal.';
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
          {!showVoidForm ? (
            <>
              {/* Cabecera del Modal */}
              <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700 no-print">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                  Detalle de Venta
                </h3>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Banner de Anulación (Solo si está anulada) */}
              {sale.isVoided && (
                <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg flex items-start gap-3 no-print">
                  <AlertTriangle
                    className="text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                    size={20}
                  />
                  <div>
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">
                      Venta Anulada
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Motivo: {sale.voidedReason || 'No especificado'}
                    </p>
                  </div>
                </div>
              )}

              {/* Área imprimible del Ticket */}
              <div className="p-6 grow" id="printable-ticket">
                <div className="text-center mb-6 border-b border-dashed border-slate-200 dark:border-slate-700 pb-4">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {settings?.companyName || 'Modexastock'}
                  </h2>
                  {settings?.taxId && (
                    <p className="text-xs text-slate-500 mt-1">{settings.taxId}</p>
                  )}
                  {settings?.address && (
                    <p className="text-xs text-slate-500">{settings.address}</p>
                  )}
                  {settings?.phone && (
                    <p className="text-xs text-slate-500">Tel: {settings.phone}</p>
                  )}

                  <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Ticket de Venta{' '}
                      {sale.isVoided && <span className="text-red-600">(ANULADO)</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Folio: #{sale.id.substring(0, 8).toUpperCase()}
                    </p>
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
                    {sale.items?.map((item: any, index: number) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 dark:border-slate-700/50"
                      >
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

                <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-4 space-y-2">
                  {/* ✅ AGREGAR ESTO ARRIBA */}
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Cliente:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {sale.client ? sale.client.name : 'Consumidor Final'}
                    </span>
                  </div>
                  {sale.client?.document && (
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Documento:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {sale.client.document}
                      </span>
                    </div>
                  )}

                  {/* Resto de campos (Referencia, Pago, Total)... */}
                  <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-4 space-y-2">
                    {sale.reference && (
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>Referencia:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {sale.reference}
                        </span>
                      </div>
                    )}

                    {/* ✅ DATOS DEL CLIENTE */}
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Cliente:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {sale.client ? sale.client.name : 'Consumidor Final'}
                      </span>
                    </div>
                    {sale.client?.document && (
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>Documento:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {sale.client.document}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Método de Pago:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {sale.paymentMethod}
                      </span>
                    </div>

                    {/* ✅ EFECTIVO RECIBIDO Y CAMBIO AGREGADOS AQUÍ */}
                    {sale.paymentMethod.includes('CASH') && sale.receivedAmount > 0 && (
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>Efectivo Recibido:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatCurrency(sale.receivedAmount)}
                        </span>
                      </div>
                    )}
                    {sale.paymentMethod.includes('CASH') && sale.change >= 0 && (
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>Cambio:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatCurrency(sale.change)}
                        </span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between text-3xl font-extrabold text-slate-900 dark:text-white pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(sale.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center flex flex-col items-center gap-2">
                  <CheckCircle
                    className={`w-8 h-8 ${sale.isVoided ? 'text-red-500' : 'text-green-500'}`}
                  />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 px-4">
                    {getFooterMessage()}
                  </p>
                </div>
              </div>

              {/* Footer del Modal con acciones */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 no-print bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl space-y-3">
                {/* Botón de Anular (Solo si NO está anulada) */}
                {!sale.isVoided && (
                  <button
                    onClick={() => setShowVoidForm(true)}
                    className="w-full py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold rounded-xl border border-red-200 dark:border-red-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={18} /> Anular Venta (Requiere Admin)
                  </button>
                )}

                {/* ✅ LÓGICA DE BOTONES (WHATSAPP / COMPARTIR / IMPRIMIR) */}
                {showWaInput ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="Ej: 3001234567"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowWaInput(false)}
                        className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-sm font-semibold rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSendWhatsApp}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={16} /> Enviar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowWaInput(true)}
                      className="flex-1 py-2.5 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20 text-green-600 dark:text-green-400 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border border-green-200 dark:border-green-500/30"
                    >
                      <MessageCircle size={18} /> WhatsApp
                    </button>
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
                      <Printer size={18} /> Imprimir
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // FORMULARIO DE AUTORIZACIÓN DE ANULACIÓN
            <form onSubmit={handleVoidSale} className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="text-red-600" size={24} />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Autorizar Anulación
                </h2>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Esta acción devolverá el inventario y revertirá el dinero. Requiere permisos de
                administrador.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Motivo de Anulación *
                </label>
                <input
                  type="text"
                  required
                  value={voidData.reason}
                  onChange={(e) => setVoidData({ ...voidData, reason: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="Ej: Cliente devolvió el producto, error de facturación..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Email Administrador
                </label>
                <input
                  type="email"
                  required
                  value={voidData.adminEmail}
                  onChange={(e) => setVoidData({ ...voidData, adminEmail: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={voidData.adminPassword}
                  onChange={(e) => setVoidData({ ...voidData, adminPassword: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVoidForm(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isVoiding}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
                >
                  {isVoiding ? <Loader2 className="animate-spin" size={16} /> : <Ban size={16} />}
                  Confirmar Anulación
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
