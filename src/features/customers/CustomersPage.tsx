import { FormEvent, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { auditLog } from "@/lib/audit";
import { currency, compactDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { TenantContext } from "@/lib/tenant";
import type { Customer, CustomerNote, CustomerTag, Invoice } from "@/types/domain";

type CustomerWithRelations = Customer & {
  customer_notes?: CustomerNote[];
  invoices?: Invoice[];
  customer_tag_assignments?: { customer_tags: CustomerTag }[];
};

export function CustomersPage() {
  const tenant = useOutletContext<TenantContext>();
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([]);
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<CustomerWithRelations | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", status: "new" });
  const [note, setNote] = useState("");

  const filtered = useMemo(() => {
    return customers.filter((customer) => {
      const matchesQuery =
        customer.name.toLowerCase().includes(query.toLowerCase()) || customer.phone.includes(query.trim());
      const matchesStatus = status === "all" || customer.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [customers, query, status]);

  async function loadCustomers() {
    const [{ data: customerData, error }, { data: tagData }] = await Promise.all([
      supabase
        .from("customers")
        .select("*, customer_notes(*), invoices(*), customer_tag_assignments(customer_tags(*))")
        .eq("business_id", tenant.business.id)
        .order("updated_at", { ascending: false }),
      supabase.from("customer_tags").select("*").eq("business_id", tenant.business.id).order("name"),
    ]);
    if (error) throw error;
    setCustomers((customerData || []) as unknown as CustomerWithRelations[]);
    setTags((tagData || []) as CustomerTag[]);
  }

  useEffect(() => {
    loadCustomers();
  }, [tenant.business.id]);

  async function createCustomer(event: FormEvent) {
    event.preventDefault();
    const { data, error } = await supabase
      .from("customers")
      .insert({
        business_id: tenant.business.id,
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        status: form.status as Customer["status"],
      })
      .select()
      .single();
    if (error) throw error;
    await auditLog(tenant.business.id, "customer.created", "customer", data.id);
    setForm({ name: "", phone: "", email: "", status: "new" });
    await loadCustomers();
  }

  async function addNote(event: FormEvent) {
    event.preventDefault();
    if (!selected || !note.trim()) return;
    await supabase.from("customer_notes").insert({
      business_id: tenant.business.id,
      customer_id: selected.id,
      body: note.trim(),
    });
    await auditLog(tenant.business.id, "customer.note_created", "customer", selected.id);
    setNote("");
    await loadCustomers();
  }

  async function createTag(name: string) {
    const clean = name.trim();
    if (!clean) return;
    await supabase.from("customer_tags").insert({ business_id: tenant.business.id, name: clean });
    await loadCustomers();
  }

  async function assignTag(customerId: string, tagId: string) {
    await supabase.from("customer_tag_assignments").insert({
      business_id: tenant.business.id,
      customer_id: customerId,
      tag_id: tagId,
    });
    await loadCustomers();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">Search, tag, note, and track customer value from real invoices.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name or phone" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All customers</option>
            <option value="new">New</option>
            <option value="regular">Regular</option>
            <option value="vip">VIP</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No customers found" body="Create your first customer or adjust the search filters." />
        ) : (
          <div className="grid gap-3">
            {filtered.map((customer) => (
              <button key={customer.id} className="text-left" onClick={() => setSelected(customer)}>
                <Card className={selected?.id === customer.id ? "ring-2 ring-primary" : undefined}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{customer.name}</h2>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      </div>
                      <Badge>{customer.status}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <span>LTV: {currency.format(customer.lifetime_value)}</span>
                      <span>Visits: {customer.visit_count}</span>
                      <span>
                        Last: {customer.last_purchase_at ? compactDate.format(new Date(customer.last_purchase_at)) : "None"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {customer.customer_tag_assignments?.map((assignment) => (
                        <Badge key={assignment.customer_tags.id} style={{ borderColor: assignment.customer_tags.color }}>
                          {assignment.customer_tags.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createCustomer}>
              <Input placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              <Input placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
              <Input placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="new">New</option>
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
                <option value="inactive">Inactive</option>
              </Select>
              <Button className="w-full">Create customer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected ? (
              <p className="text-sm text-muted-foreground">Select a customer to manage notes, tags, and purchase history.</p>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground">{selected.email || "No email saved"}</p>
                </div>
                <div className="space-y-2">
                  <Select onChange={(event) => assignTag(selected.id, event.target.value)} defaultValue="">
                    <option value="" disabled>
                      Assign tag
                    </option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Create new tag"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        createTag(event.currentTarget.value);
                        event.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
                <form className="space-y-2" onSubmit={addNote}>
                  <Textarea placeholder="Add customer note" value={note} onChange={(event) => setNote(event.target.value)} />
                  <Button className="w-full" variant="secondary">
                    Save note
                  </Button>
                </form>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Notes</h4>
                  {selected.customer_notes?.map((item) => (
                    <p key={item.id} className="rounded-md bg-secondary p-2 text-sm">
                      {item.body}
                    </p>
                  ))}
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Purchase History</h4>
                  {selected.invoices?.length ? (
                    selected.invoices.map((invoice) => (
                      <div key={invoice.id} className="flex justify-between text-sm">
                        <span>{invoice.invoice_number}</span>
                        <span>{currency.format(invoice.total)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No invoice purchases yet.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
