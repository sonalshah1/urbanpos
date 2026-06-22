import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Megaphone, Palette, ReceiptText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTenantContext, type TenantContext } from "@/lib/tenant";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/invoices", label: "Invoices", icon: ReceiptText },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone, ownerOnly: true },
  { to: "/branding", label: "Branding", icon: Palette, ownerOnly: true },
];

export function Shell() {
  const [tenant, setTenant] = useState<TenantContext | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getTenantContext()
      .then((context) => {
        if (!context) navigate("/onboarding");
        setTenant(context);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading RetailOS</div>;
  if (!tenant) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur no-print">
        <div className="container flex h-16 items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold" style={{ color: tenant.business.brand_color }}>
              {tenant.business.name}
            </p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{tenant.role}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="container grid gap-4 py-4 md:grid-cols-[220px_1fr]">
        <nav className="no-print flex gap-2 overflow-x-auto md:block md:space-y-1">
          {navItems.filter((item) => !item.ownerOnly || tenant.role === "owner").map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
                  isActive && "bg-primary text-primary-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main>
          <Outlet context={tenant} />
        </main>
      </div>
    </div>
  );
}
