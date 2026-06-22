import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { currency, compactDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { TenantContext } from "@/lib/tenant";
import type { DashboardMetrics, Invoice } from "@/types/domain";

export function DashboardPage() {
  const tenant = useOutletContext<TenantContext>();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const iso = today.toISOString();

    Promise.all([
      supabase.from("invoices").select("*").eq("business_id", tenant.business.id).gte("issued_at", iso).order("issued_at"),
      supabase.from("customers").select("*", { count: "exact", head: true }).eq("business_id", tenant.business.id),
      supabase.from("customers").select("*", { count: "exact", head: true }).eq("business_id", tenant.business.id).gt("visit_count", 1),
      supabase.from("customers").select("*", { count: "exact", head: true }).eq("business_id", tenant.business.id).gte("created_at", iso),
      supabase.from("invoices").select("*").eq("business_id", tenant.business.id).order("issued_at", { ascending: false }).limit(5),
    ]).then(([todayInvoices, totalCustomers, repeatCustomers, todaysCustomers, recentInvoices]) => {
      const revenue = (todayInvoices.data || []).reduce((sum, invoice) => sum + Number(invoice.total), 0);
      setMetrics({
        todaysRevenue: revenue,
        todaysCustomers: todaysCustomers.count || 0,
        totalCustomers: totalCustomers.count || 0,
        repeatCustomers: repeatCustomers.count || 0,
        recentInvoices: (recentInvoices.data || []) as Invoice[],
      });
    });
  }, [tenant.business.id]);

  if (!metrics) return <p className="text-sm text-muted-foreground">Loading dashboard</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live revenue, customers, repeat business, and recent invoices.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Today's Revenue" value={currency.format(metrics.todaysRevenue)} />
        <Metric title="Today's Customers" value={String(metrics.todaysCustomers)} />
        <Metric title="Total Customers" value={String(metrics.totalCustomers)} />
        <Metric title="Repeat Customers" value={String(metrics.repeatCustomers)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentInvoices.length === 0 ? (
            <EmptyState title="No invoices yet" body="Issued invoices will appear here as soon as your team creates them." />
          ) : (
            <div className="divide-y">
              {metrics.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-3 text-sm">
                  <span>{invoice.invoice_number}</span>
                  <span>{compactDate.format(new Date(invoice.issued_at))}</span>
                  <span className="font-medium">{currency.format(invoice.total)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
