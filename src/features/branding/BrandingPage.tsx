import { FormEvent, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { auditLog } from "@/lib/audit";
import { supabase } from "@/lib/supabase";
import type { TenantContext } from "@/lib/tenant";
import type { PrintSize } from "@/types/domain";

export function BrandingPage() {
  const tenant = useOutletContext<TenantContext>();
  const [business, setBusiness] = useState({
    name: tenant.business.name,
    address: tenant.business.address || "",
    phone: tenant.business.phone || "",
    logo_url: tenant.business.logo_url || "",
    brand_color: tenant.business.brand_color || "#0f766e",
    review_link: tenant.business.review_link || "",
  });
  const [settings, setSettings] = useState({
    invoice_footer: tenant.settings?.invoice_footer || "",
    default_print_size: tenant.settings?.default_print_size || "a4",
    whatsapp_template: tenant.settings?.whatsapp_template || "",
  });
  const [saved, setSaved] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    await supabase
      .from("businesses")
      .update({
        name: business.name,
        address: business.address || null,
        phone: business.phone || null,
        logo_url: business.logo_url || null,
        brand_color: business.brand_color,
        review_link: business.review_link || null,
      })
      .eq("id", tenant.business.id);

    await supabase.from("settings").upsert({
      business_id: tenant.business.id,
      invoice_footer: settings.invoice_footer || null,
      default_print_size: settings.default_print_size as PrintSize,
      whatsapp_template: settings.whatsapp_template || null,
    });

    await auditLog(tenant.business.id, "branding.updated", "business", tenant.business.id);
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Branding</h1>
        <p className="text-sm text-muted-foreground">Control invoice identity, review links, print defaults, and customer-facing messaging.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={save}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={business.name} onChange={(event) => setBusiness({ ...business, name: event.target.value })} required />
              <Input value={business.phone} onChange={(event) => setBusiness({ ...business, phone: event.target.value })} placeholder="Phone" />
            </div>
            <Input value={business.address} onChange={(event) => setBusiness({ ...business, address: event.target.value })} placeholder="Address" />
            <Input value={business.logo_url} onChange={(event) => setBusiness({ ...business, logo_url: event.target.value })} placeholder="Logo URL" />
            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <Input
                type="color"
                value={business.brand_color}
                onChange={(event) => setBusiness({ ...business, brand_color: event.target.value })}
                aria-label="Brand color"
              />
              <Input
                value={business.review_link}
                onChange={(event) => setBusiness({ ...business, review_link: event.target.value })}
                placeholder="Google review link"
              />
            </div>
            <Textarea
              value={settings.invoice_footer}
              onChange={(event) => setSettings({ ...settings, invoice_footer: event.target.value })}
              placeholder="Invoice footer"
            />
            <Textarea
              value={settings.whatsapp_template}
              onChange={(event) => setSettings({ ...settings, whatsapp_template: event.target.value })}
              placeholder="WhatsApp template"
            />
            <Select
              value={settings.default_print_size}
              onChange={(event) => setSettings({ ...settings, default_print_size: event.target.value as PrintSize })}
            >
              <option value="thermal-58">58mm Thermal</option>
              <option value="thermal-80">80mm Thermal</option>
              <option value="a4">A4</option>
            </Select>
            {saved && <p className="rounded-md bg-secondary p-3 text-sm">Branding settings saved.</p>}
            <Button className="w-full sm:w-fit">Save branding</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
