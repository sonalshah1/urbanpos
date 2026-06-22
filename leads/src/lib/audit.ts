import { supabase } from "./supabase";

export async function auditLog(
  businessId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabase.from("audit_logs").insert({
    business_id: businessId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });

  if (error) {
    console.error("Audit log failed", error);
  }
}
