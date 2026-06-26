import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    if (mode === "signup") {
      setMessage("Account created. Check email confirmation if your Supabase project requires it.");
      return;
    }

    navigate("/");
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>RetailOS</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to your business workspace.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {message && <p className="rounded-md bg-secondary p-3 text-sm">{message}</p>}
            <Button className="w-full" disabled={loading}>
              {loading ? "Working" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <Button className="mt-3 w-full" variant="ghost" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Create an account" : "I already have an account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
