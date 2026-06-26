import { currency, formatPhoneForWhatsApp } from "./format";
import type { Business, Customer, Invoice, InvoiceItem } from "@/types/domain";

export function buildInvoiceMessage(
  business: Business,
  customer: Customer,
  invoice: Invoice,
  items: InvoiceItem[],
  footer?: string | null,
) {
  const itemLines = items.map((item) => `${item.description} x ${item.quantity}: ${currency.format(item.line_total)}`);
  const reviewLine = invoice.review_link ? `Review us: ${invoice.review_link}` : "";

  return [
    `Hello ${customer.name},`,
    `Invoice ${invoice.invoice_number} from ${business.name}`,
    ...itemLines,
    `Total: ${currency.format(invoice.total)}`,
    footer || "",
    reviewLine,
  ]
    .filter(Boolean)
    .join("\n");
}

export function openWhatsAppInvoice(phone: string, message: string) {
  const recipient = formatPhoneForWhatsApp(phone);
  const url = `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
