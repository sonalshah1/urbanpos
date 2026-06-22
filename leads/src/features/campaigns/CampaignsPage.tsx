import { FormEvent, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { auditLog } from "@/lib/audit";
import { supabase } from "@/lib/supabase";
import type { TenantContext } from "@/lib/tenant";
import type { Campaign, CampaignAudience, Customer } from "@/types/domain";

export function CampaignsPage() {
  const tenant = useOutletContext<TenantContext>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recipients, setRecipients] = useState<Customer[]>([]);
  const [form, setForm] = useState({ name: "", audience: "all", message: "" });

  async function load() {
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("business_id", tenant.business.id)
      .order("created_at", { ascending: false });
    setCampaigns((data || []) as Campaign[]);
  }

  useEffect(() => {
    load();
  }, [tenant.business.id]);

  async function createCampaign(event: FormEvent) {
    event.preventDefault();
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        business_id: tenant.business.id,
        name: form.name,
        audience: form.audience as CampaignAudience,
        message: form.message,
      })
      .select()
      .single();
    if (error) throw error;
    await auditLog(tenant.business.id, "campaign.created", "campaign", data.id);
    setForm({ name: "", audience: "all", message: "" });
    await load();
  }

  async function generateBroadcastList(audience: CampaignAudience) {
    let query = supabase.from("customers").select("*").eq("business_id", tenant.business.id);
    if (audience === "vip") query = query.eq("status", "vip");
    if (audience === "repeat") query = query.gt("visit_count", 1);
    if (audience === "inactive") query = query.eq("status", "inactive");
    const { data } = await query.order("name");
    setRecipients((data || []) as Customer[]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Create campaigns and generate customer broadcast lists from live CRM segments.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>New Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createCampaign}>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Campaign name" required />
              <Select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}>
                <option value="all">All Customers</option>
                <option value="vip">VIP Customers</option>
                <option value="repeat">Repeat Customers</option>
                <option value="inactive">Inactive Customers</option>
              </Select>
              <Textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Campaign message" required />
              <Button className="w-full">Create campaign</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        {campaigns.length === 0 ? (
          <EmptyState title="No campaigns yet" body="Campaigns created from customer segments will appear here." />
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{campaign.name}</h2>
                    <p className="text-sm text-muted-foreground">{campaign.audience} audience</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => generateBroadcastList(campaign.audience)}>
                    Generate broadcast list
                  </Button>
                </div>
                <p className="mt-3 text-sm">{campaign.message}</p>
              </CardContent>
            </Card>
          ))
        )}

        {recipients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Broadcast List</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly
                value={recipients.map((customer) => `${customer.name},${customer.phone}`).join("\n")}
                className="min-h-56 font-mono"
              />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
