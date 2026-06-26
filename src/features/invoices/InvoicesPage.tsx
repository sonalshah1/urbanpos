import { FormEvent, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download, MessageCircle, Printer, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { auditLog } from "@/lib/audit";
import { currency, compactDate } from "@/lib/format";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { printInvoice } from "@/lib/print";
import { supabase } from "@/lib/supabase";
import { buildInvoiceMessage, openWhatsAppInvoice } from "@/lib/whatsapp";
import type { TenantContext } from "@/lib/tenant";
import type { Customer, Invoice, InvoiceItem, PrintSize } from "@/types/domain";

type InvoiceWithItems = Invoice & {
  customers?: Customer;
  invoice_items?: InvoiceItem[];
};

type DraftItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

export function InvoicesPage() {
  const tenant = useOutletContext<TenantContext>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithItems[]>([]);
  const [selected, setSelected] = useState<InvoiceWithItems | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [printSize, setPrintSize] = useState<PrintSize>(tenant.settings?.default_print_size || "a4");
  const [items, setItems] = useState<DraftItem[]>([{ description: "", quantity: 1, unit_price: 0 }]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0),
    [items],
  );

  async function load() {
    const [{ data: customerData }, { data: invoiceData, error }] = await Promise.all([
      supabase.from("customers").select("*").eq("business_id", tenant.business.id).order("name"),
      supabase
        .from("invoices")
        .select("*, customers(*), invoice_items(*)")
        .eq("business_id", tenant.business.id)
        .order("issued_at", { ascending: false })
        .limit(50),
    ]);
    if (error) throw error;
    setCustomers((customerData || []) as Customer[]);
    setInvoices((invoiceData || []) as unknown as InvoiceWithItems[]);
  }

  useEffect(() => {
    load();
  }, [tenant.business.id]);

  async function nextInvoiceNumber() {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("business_id", tenant.business.id)
      .gte("created_at", `${year}-01-01T00:00:00.000Z`);
    return `INV-${year}-${String((count || 0) + 1).padStart(5, "0")}`;
  }

  async function createInvoice(event: FormEvent) {
    event.preventDefault();
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return;

    const invoiceNumber = await nextInvoiceNumber();
    const cleanItems = items.filter((item) => item.description.trim() && item.quantity > 0);
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        business_id: tenant.business.id,
        customer_id: customer.id,
        invoice_number: invoiceNumber,
        subtotal,
        total: subtotal,
        print_size: printSize,
        review_link: tenant.business.review_link,
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from("invoice_items").insert(
      cleanItems.map((item) => ({
        business_id: tenant.business.id,
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
      })),
    );

    await supabase
      .from("customers")
      .update({
        lifetime_value: Number(customer.lifetime_value) + subtotal,
        visit_count: Number(customer.visit_count) + 1,
        last_purchase_at: new Date().toISOString(),
        status: Number(customer.visit_count) + 1 > 1 ? "regular" : customer.status,
      })
      .eq("id", customer.id)
      .eq("business_id", tenant.business.id);

    await auditLog(tenant.business.id, "invoice.created", "invoice", invoice.id, { invoice_number: invoiceNumber });
    setCustomerId("");
    setItems([{ description: "", quantity: 1, unit_price: 0 }]);
    await load();
  }

  async function downloadSelectedPdf(invoice: InvoiceWithItems) {
    if (!invoice.customers) return;
    await downloadInvoicePdf(tenant.business, tenant.settings, invoice.customers, invoice, invoice.invoice_items || []);
  }

  function shareSelected(invoice: InvoiceWithItems) {
    if (!invoice.customers) return;
    const message = buildInvoiceMessage(
      tenant.business,
      invoice.customers,
      invoice,
      invoice.invoice_items || [],
      tenant.settings?.invoice_footer,
    );
    openWhatsAppInvoice(invoice.customers.phone, message);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <section className="space-y-4 no-print">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground">Create invoices with PDF, thermal print, A4 print, WhatsApp, and review QR support.</p>
        </div>
        <Card className="no-print">
          <CardHeader>
            <CardTitle>New Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createInvoice}>
              <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </Select>
              <Select value={printSize} onChange={(event) => setPrintSize(event.target.value as PrintSize)}>
                <option value="thermal-58">58mm Thermal</option>
                <option value="thermal-80">80mm Thermal</option>
                <option value="a4">A4</option>
              </Select>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_72px_96px_40px] gap-2">
                    <Input
                      placeholder="Item"
                      value={item.description}
                      onChange={(event) => {
                        const next = [...items];
                        next[index].description = event.target.value;
                        setItems(next);
                      }}
                      required
                    />
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => {
                        const next = [...items];
                        next[index].quantity = Number(event.target.value);
                        setItems(next);
                      }}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(event) => {
                        const next = [...items];
                        next[index].unit_price = Number(event.target.value);
                        setItems(next);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setItems([...items, { description: "", quantity: 1, unit_price: 0 }])}
              >
                <Plus className="h-4 w-4" /> Add line
              </Button>
              <div className="flex items-center justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span>{currency.format(subtotal)}</span>
              </div>
              <Button className="w-full">Issue invoice</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        {invoices.length === 0 ? (
          <div className="no-print">
            <EmptyState title="No invoices issued" body="Customer invoices will appear here after they are created." />
          </div>
        ) : (
          <div className="grid gap-3 no-print">
            {invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button className="text-left" onClick={() => setSelected(invoice)}>
                      <h2 className="font-semibold">{invoice.invoice_number}</h2>
                      <p className="text-sm text-muted-foreground">
                        {invoice.customers?.name} - {compactDate.format(new Date(invoice.issued_at))}
                      </p>
                    </button>
                    <p className="font-semibold">{currency.format(invoice.total)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 no-print">
                    <Button size="sm" variant="secondary" onClick={() => downloadSelectedPdf(invoice)}>
                      <Download className="h-4 w-4" /> PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelected(invoice);
                        window.setTimeout(() => printInvoice(invoice.print_size), 50);
                      }}
                    >
                      <Printer className="h-4 w-4" /> Print
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => shareSelected(invoice)}>
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selected && (
          <Card className="print-surface" data-print-size={selected.print_size}>
            <CardHeader>
              <CardTitle>{tenant.business.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{tenant.business.address}</p>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-between text-sm">
                <span>{selected.invoice_number}</span>
                <span>{selected.customers?.name}</span>
              </div>
              <div className="space-y-2">
                {selected.invoice_items?.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_48px_88px] gap-2 text-sm">
                    <span>{item.description}</span>
                    <span className="text-right">{item.quantity}</span>
                    <span className="text-right">{currency.format(item.line_total)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span>{currency.format(selected.total)}</span>
              </div>
              {tenant.settings?.invoice_footer && <p className="mt-4 text-center text-xs">{tenant.settings.invoice_footer}</p>}
              {selected.review_link && <p className="mt-2 text-center text-xs">Review: {selected.review_link}</p>}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
