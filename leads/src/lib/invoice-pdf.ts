import jsPDF from "jspdf";
import QRCode from "qrcode";
import { currency, compactDate } from "./format";
import type { Business, Customer, Invoice, InvoiceItem, Settings } from "@/types/domain";

export async function downloadInvoicePdf(
  business: Business,
  settings: Settings | null,
  customer: Customer,
  invoice: Invoice,
  items: InvoiceItem[],
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  let y = 56;

  doc.setTextColor(business.brand_color || "#0f766e");
  doc.setFontSize(22);
  doc.text(business.name, left, y);
  doc.setTextColor("#111827");
  doc.setFontSize(10);
  y += 18;
  if (business.address) {
    doc.text(business.address, left, y);
    y += 14;
  }
  if (business.phone) {
    doc.text(`Phone: ${business.phone}`, left, y);
    y += 14;
  }

  y += 22;
  doc.setFontSize(16);
  doc.text(`Invoice ${invoice.invoice_number}`, left, y);
  doc.setFontSize(10);
  doc.text(compactDate.format(new Date(invoice.issued_at)), 470, y, { align: "right" });

  y += 28;
  doc.setFontSize(11);
  doc.text(`Bill To: ${customer.name}`, left, y);
  y += 16;
  doc.text(customer.phone, left, y);

  y += 30;
  doc.setFontSize(10);
  doc.text("Item", left, y);
  doc.text("Qty", 330, y, { align: "right" });
  doc.text("Price", 410, y, { align: "right" });
  doc.text("Total", 520, y, { align: "right" });
  y += 8;
  doc.line(left, y, 520, y);
  y += 18;

  items.forEach((item) => {
    doc.text(item.description, left, y);
    doc.text(String(item.quantity), 330, y, { align: "right" });
    doc.text(currency.format(item.unit_price), 410, y, { align: "right" });
    doc.text(currency.format(item.line_total), 520, y, { align: "right" });
    y += 18;
  });

  y += 10;
  doc.line(360, y, 520, y);
  y += 20;
  doc.setFontSize(14);
  doc.text("Total", 360, y);
  doc.text(currency.format(invoice.total), 520, y, { align: "right" });

  if (invoice.review_link) {
    const qr = await QRCode.toDataURL(invoice.review_link, { margin: 1, width: 96 });
    doc.addImage(qr, "PNG", left, 660, 96, 96);
    doc.setFontSize(10);
    doc.text("Scan to review us", left, 772);
  }

  if (settings?.invoice_footer) {
    doc.setFontSize(10);
    doc.text(settings.invoice_footer, 300, 772, { align: "center", maxWidth: 250 });
  }

  doc.save(`${invoice.invoice_number}.pdf`);
}
