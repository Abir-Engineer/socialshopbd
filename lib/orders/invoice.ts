export function generateInvoiceHtml(
  shopName: string,
  shopAddress: string,
  orderNumber: string,
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  date: string,
  items: { name: string; sku: string; qty: number; price: number; total: number }[],
  subtotal: number,
  deliveryCharge: number,
  discount: number,
  total: number,
  paymentStatus: string,
): string {
  const itemRows = items
    .map(
      (i) => `
      <tr>
        <td>${escapeHtml(i.name)}</td>
        <td>${escapeHtml(i.sku)}</td>
        <td class="center">${i.qty}</td>
        <td class="right">৳${i.price.toLocaleString("en-BD")}</td>
        <td class="right">৳${i.total.toLocaleString("en-BD")}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice #${escapeHtml(orderNumber)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px; color: #1a1a2e; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px; }
    .shop-info h1 { font-size: 22px; font-weight: 700; }
    .shop-info p { color: #64748b; margin-top: 2px; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 28px; font-weight: 300; color: #64748b; }
    .invoice-title p { font-size: 14px; color: #1a1a2e; font-weight: 600; margin-top: 4px; }
    .customer-info { margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; }
    .customer-info h3 { font-size: 13px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .customer-info p { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    .right { text-align: right; }
    .center { text-align: center; }
    .totals { width: 300px; margin-left: auto; }
    .totals td { border: none; padding: 6px 12px; }
    .totals .total-row td { font-size: 16px; font-weight: 700; border-top: 2px solid #1a1a2e; padding-top: 8px; }
    .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="shop-info">
      <h1>${escapeHtml(shopName)}</h1>
      <p>${escapeHtml(shopAddress)}</p>
    </div>
    <div class="invoice-title">
      <h2>INVOICE</h2>
      <p>#${escapeHtml(orderNumber)}</p>
    </div>
  </div>

  <div class="customer-info">
    <div style="display:flex;justify-content:space-between;">
      <div>
        <h3>Bill To</h3>
        <p>${escapeHtml(customerName)}<br/>${escapeHtml(customerPhone)}</p>
      </div>
      <div style="text-align:right;">
        <h3>Date</h3>
        <p>${escapeHtml(date)}</p>
      </div>
    </div>
    ${customerAddress ? `<p style="margin-top: 8px;">${escapeHtml(customerAddress)}</p>` : ""}
  </div>

  <table>
    <thead>
      <tr><th>Item</th><th>SKU</th><th class="center">Qty</th><th class="right">Price</th><th class="right">Total</th></tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="right">৳${subtotal.toLocaleString("en-BD")}</td></tr>
    <tr><td>Delivery Charge</td><td class="right">৳${deliveryCharge.toLocaleString("en-BD")}</td></tr>
    ${discount > 0 ? `<tr><td>Discount</td><td class="right">-৳${discount.toLocaleString("en-BD")}</td></tr>` : ""}
    <tr class="total-row"><td>Total</td><td class="right">৳${total.toLocaleString("en-BD")}</td></tr>
    <tr><td>Payment Status</td><td class="right">${escapeHtml(paymentStatus)}</td></tr>
  </table>

  <div class="footer">
    <p>Thank you for your business!</p>
  </div>
  <div class="no-print" style="text-align:center;margin-top:20px;">
    <button onclick="window.print()" style="padding:10px 24px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">Print Invoice</button>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
