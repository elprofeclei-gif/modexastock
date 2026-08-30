import { formatCurrency } from './format';

interface Sale {
  id: string;
  createdAt: string;
  totalAmount: number;
  discountAmount?: number;
  receivedAmount: number;
  change: number;
  paymentMethod: string;
  reference?: string | null;
  user?: { name: string };
  client?: { name: string; document?: string | null } | null;
  items: {
    quantity: number;
    unitPrice: number;
    subtotal: number;
    productVariant: {
      product: { name: string };
      size: { name: string };
      color: { name: string };
    };
  }[];
}

interface Settings {
  companyName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  ticketFooter?: string;
}

export const printThermalTicket = (sale: Sale, settings: Settings | null) => {
  const date = new Date(sale.createdAt).toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const itemsHtml = sale.items
    .map(
      (item) => `
    <tr>
      <td class="qty">${item.quantity}x</td>
      <td class="desc">
        ${item.productVariant.product.name}
        <span class="variant">${item.productVariant.size.name} / ${item.productVariant.color.name}</span>
      </td>
      <td class="price">${formatCurrency(item.subtotal)}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket #${sale.id.substring(0, 8)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          width: 80mm;
          padding: 5mm;
          color: #000;
        }
        .header { text-align: center; margin-bottom: 10px; }
        .header h2 { font-size: 18px; font-weight: bold; text-transform: uppercase; }
        .header p { font-size: 12px; margin-top: 2px; }
        .info { font-size: 12px; margin-bottom: 10px; }
        .info div { display: flex; justify-content: space-between; margin-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 5px; }
        thead th { font-size: 11px; text-align: left; border-bottom: 1px dashed #000; padding-bottom: 3px; }
        thead th:last-child { text-align: right; }
        tr { vertical-align: top; }
        .qty { width: 15%; font-weight: bold; }
        .desc { width: 65%; padding-right: 5px; }
        .variant { display: block; font-size: 11px; color: #444; font-weight: normal; }
        .price { width: 20%; text-align: right; white-space: nowrap; }
        .totals { margin-top: 5px; font-size: 13px; }
        .totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .total-bold { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        .dashed { border-bottom: 1px dashed #000; margin: 10px 0; }
        .payment-method { font-size: 11px; margin-top: 5px; font-weight: bold; text-align: center; }
        @media print {
          body { width: 80mm; padding: 0; }
          @page { margin: 0; size: 80mm auto; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${settings?.companyName || 'Modexastock'}</h2>
        ${settings?.taxId ? `<p>RIF/NIT: ${settings.taxId}</p>` : ''}
        ${settings?.address ? `<p>${settings.address}</p>` : ''}
        ${settings?.phone ? `<p>Tel: ${settings.phone}</p>` : ''}
      </div>

      <div class="dashed"></div>

      <div class="info">
        <div><span>Folio:</span><span>#${sale.id.substring(0, 8).toUpperCase()}</span></div>
        <div><span>Fecha:</span><span>${date}</span></div>
        <div><span>Cajero:</span><span>${sale.user?.name || 'N/A'}</span></div>
        
       
        <div><span>Cliente:</span><span>${sale.client ? sale.client.name : 'Consumidor Final'}</span></div>
        ${sale.client?.document ? `<div><span>Doc:</span><span>${sale.client.document}</span></div>` : ''}
        
        <div><span>Pago:</span><span>${sale.paymentMethod}</span></div>
        ${sale.reference ? `<div><span>Ref:</span><span>${sale.reference}</span></div>` : ''}
      </div>

      <div class="dashed"></div>

      <table>
        <thead>
          <tr>
            <th>Cant.</th>
            <th>Descripción</th>
            <th style="text-align: right;">Importe</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="dashed"></div>

           <div class="totals">
        ${
          sale.discountAmount && sale.discountAmount > 0
            ? `
          <div><span>Subtotal:</span><span>$${formatCurrency(sale.totalAmount + sale.discountAmount)}</span></div>
          <div><span>Descuento:</span><span>- $${formatCurrency(sale.discountAmount)}</span></div>
        `
            : ''
        }
        ${
          sale.paymentMethod.includes('CASH')
            ? `
          <div><span>Efectivo Recibido:</span><span>$${formatCurrency(sale.receivedAmount)}</span></div>
          <div><span>Cambio:</span><span>$${formatCurrency(sale.change)}</span></div>
        `
            : ''
        }
        <div class="total-bold"><span>TOTAL:</span><span>$${formatCurrency(sale.totalAmount)}</span></div>
        
        
        ${sale.paymentMethod.includes(' + ') ? `<div class="payment-method"><span>Pagado con:</span><span>${sale.paymentMethod}</span></div>` : ''}
      </div>

      <div class="footer">
        <p>${settings?.ticketFooter || '¡Gracias por su compra!'}</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() {
            window.window.close();
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert('Por favor, permite las ventanas emergentes para imprimir el ticket.');
  }
};
