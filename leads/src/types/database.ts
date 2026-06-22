import type {
  Business,
  Campaign,
  Customer,
  CustomerNote,
  CustomerTag,
  Invoice,
  InvoiceItem,
  Settings,
  UserRole,
} from "./domain";

export type Database = {
  public: {
    Functions: {
      create_business_workspace: {
        Args: {
          business_name: string;
          business_address?: string | null;
          business_phone?: string | null;
          business_review_link?: string | null;
        };
        Returns: string;
      };
    };
    Tables: {
      businesses: {
        Row: Business;
        Insert: Partial<Business> & Pick<Business, "name">;
        Update: Partial<Business>;
      };
      business_memberships: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          business_id: string;
          user_id: string;
          role: UserRole;
        };
        Update: { role?: UserRole };
      };
      settings: {
        Row: Settings;
        Insert: Partial<Settings> & Pick<Settings, "business_id">;
        Update: Partial<Settings>;
      };
      customers: {
        Row: Customer;
        Insert: Partial<Customer> & Pick<Customer, "business_id" | "name" | "phone">;
        Update: Partial<Customer>;
      };
      customer_tags: {
        Row: CustomerTag;
        Insert: Partial<CustomerTag> & Pick<CustomerTag, "business_id" | "name">;
        Update: Partial<CustomerTag>;
      };
      customer_tag_assignments: {
        Row: { business_id: string; customer_id: string; tag_id: string; created_at: string };
        Insert: { business_id: string; customer_id: string; tag_id: string };
        Update: never;
      };
      customer_notes: {
        Row: CustomerNote;
        Insert: Pick<CustomerNote, "business_id" | "customer_id" | "body"> & Partial<CustomerNote>;
        Update: Partial<CustomerNote>;
      };
      invoices: {
        Row: Invoice;
        Insert: Partial<Invoice> & Pick<Invoice, "business_id" | "customer_id" | "invoice_number" | "total">;
        Update: Partial<Invoice>;
      };
      invoice_items: {
        Row: InvoiceItem;
        Insert: Partial<InvoiceItem> &
          Pick<InvoiceItem, "business_id" | "invoice_id" | "description" | "quantity" | "unit_price" | "line_total">;
        Update: Partial<InvoiceItem>;
      };
      campaigns: {
        Row: Campaign;
        Insert: Partial<Campaign> & Pick<Campaign, "business_id" | "name" | "audience" | "message">;
        Update: Partial<Campaign>;
      };
      audit_logs: {
        Row: {
          id: string;
          business_id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          business_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: never;
      };
    };
  };
};
