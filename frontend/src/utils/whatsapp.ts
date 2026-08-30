import { formatCurrency } from './format';

interface Sale {
  id: string;
  createdAt: string;
  totalAmount: number;
  paymentMethod: string;
  items: {
    quantity: number;
    productVariant: {
      product: { name: string };
      size: { name: string };
      color: { name: string };
    };
  }[];
}

export const sendTicketByWhatsApp = (sale: Sale, phone: string, companyName: string) => {
  // Limpiar el teléfono (quitar espacios, signos +, etc.)
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  
  // Si el teléfono no tiene código de país, asumimos que es de Colombia (57) o tu país local.
  // Puedes ajustar este prefijo según el país de tu negocio.
  if (cleanPhone.length === 10) {
    cleanPhone = '57' + cleanPhone; 
  }

  const date = new Date(sale.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  
  // Construir el texto del mensaje
  let message = `*${companyName || 'Modexastock'}*\n`;
  message += `*Ticket de Compra #${sale.id.substring(0, 8).toUpperCase()}*\n`;
  message += `📅 ${date}\n`;
  message += `💳 Pago: ${sale.paymentMethod}\n`;
  message += `--------------------------------\n`;
  
  sale.items.forEach(item => {
    message += `🛍️ ${item.quantity}x ${item.productVariant.product.name}\n`;
    message += `   (${item.productVariant.size.name}/${item.productVariant.color.name})\n`;
  });
  
  message += `--------------------------------\n`;
  message += `💵 *TOTAL: ${formatCurrency(sale.totalAmount)}*\n\n`;
  message += `¡Gracias por tu compra! 🤖`;

  // Codificar el mensaje para la URL
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  // Abrir en una pestaña nueva
  window.open(whatsappUrl, '_blank');
};