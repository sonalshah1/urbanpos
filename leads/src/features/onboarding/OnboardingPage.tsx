import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export function OnboardingPage() {
  const [form, setForm] = useState({ name: "", address: "", phone: "", review_link: "" });
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/login");
    });
  }, [navigate]);

  async function createBusiness(event: FormEvent) {
    event.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    const { error } = await supabase.rpc("create_business_workspace", {
      business_name: form.name,
      business_address: form.address || null,
      business_phone: form.phone || null,
      business_review_link: form.review_link || null,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    navigate("/");
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Create your business workspace</CardTitle>
          <p className="text-sm text-muted-foreground">This creates your tenant and owner membership.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={createBusiness}>
            <Input placeholder="Business name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <Input placeholder="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <Input
              placeholder="Google review link"
              value={form.review_link}
              onChange={(event) => setForm({ ...form, review_link: event.target.value })}
            />
            {message && <p className="rounded-md bg-secondary p-3 text-sm">{message}</p>}
            <Button className="w-full">Create workspace</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
