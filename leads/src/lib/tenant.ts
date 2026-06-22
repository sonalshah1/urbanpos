import { supabase } from "./supabase";
import type { Business, Settings, UserRole } from "@/types/domain";

export type TenantContext = {
  business: Business;
  role: UserRole;
  settings: Settings | null;
};

export async function getTenantContext(): Promise<TenantContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: memberships, error: membershipError } = await supabase
    .from("business_memberships")
    .select("role,businesses(*)")
    .eq("user_id", user.id)
    .limit(1);

  if (membershipError) throw membershipError;
  const membership = memberships?.[0] as unknown as { role: UserRole; businesses: Business } | undefined;
  if (!membership?.businesses) return null;

  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("*")
    .eq("business_id", membership.businesses.id)
    .maybeSingle();

  if (settingsError) throw settingsError;

  return {
    business: membership.businesses,
    role: membership.role,
    settings,
  };
}
