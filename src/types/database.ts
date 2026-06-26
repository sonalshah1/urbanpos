import type {
  Business,
  Campaign,
  Customer,
  CustomerNote,
  CustomerTag,
  Invoice,
  InvoiceItem,
  Settings,
} from "./domain";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: Business;
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          logo_url?: string | null;
          brand_color?: string;
          review_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          address?: string | null;
          phone?: string | null;
          logo_url?: string | null;
          brand_color?: string;
          review_link?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_memberships: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          role?: string;
        };
        Relationships: [
          { foreignKeyName: "business_memberships_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "business_memberships_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      settings: {
        Row: Settings;
        Insert: {
          id?: string;
          business_id: string;
          invoice_footer?: string | null;
          default_print_size?: string;
          whatsapp_template?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          invoice_footer?: string | null;
          default_print_size?: string;
          whatsapp_template?: string | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "settings_business_id_fkey"; columns: ["business_id"]; isOneToOne: true; referencedRelation: "businesses"; referencedColumns: ["id"] }
        ];
      };
      customers: {
        Row: Customer;
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          phone: string;
          email?: string | null;
          status?: string;
          lifetime_value?: number;
          visit_count?: number;
          last_purchase_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          phone?: string;
          email?: string | null;
          status?: string;
          lifetime_value?: number;
          visit_count?: number;
          last_purchase_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "customers_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] }
        ];
      };
      customer_tags: {
        Row: CustomerTag;
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
        };
        Relationships: [
          { foreignKeyName: "customer_tags_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] }
        ];
      };
      customer_tag_assignments: {
        Row: {
          business_id: string;
          customer_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          business_id: string;
          customer_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          { foreignKeyName: "customer_tag_assignments_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "customer_tag_assignments_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] },
          { foreignKeyName: "customer_tag_assignments_tag_id_fkey"; columns: ["tag_id"]; isOneToOne: false; referencedRelation: "customer_tags"; referencedColumns: ["id"] }
        ];
      };
      customer_notes: {
        Row: CustomerNote;
        Insert: {
          id?: string;
          business_id: string;
          customer_id: string;
          body: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
        Relationships: [
          { foreignKeyName: "customer_notes_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "customer_notes_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] },
          { foreignKeyName: "customer_notes_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      invoices: {
        Row: Invoice;
        Insert: {
          id?: string;
          business_id: string;
          customer_id: string;
          invoice_number: string;
          status?: string;
          subtotal?: number;
          discount?: number;
          total: number;
          print_size?: string;
          review_link?: string | null;
          issued_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          subtotal?: number;
          discount?: number;
          total?: number;
          print_size?: string;
          review_link?: string | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "invoices_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "invoices_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] }
        ];
      };
      invoice_items: {
        Row: InvoiceItem;
        Insert: {
          id?: string;
          business_id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          line_total: number;
          created_at?: string;
        };
        Update: {
          description?: string;
          quantity?: number;
          unit_price?: number;
          line_total?: number;
        };
        Relationships: [
          { foreignKeyName: "invoice_items_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "invoice_items_invoice_id_fkey"; columns: ["invoice_id"]; isOneToOne: false; referencedRelation: "invoices"; referencedColumns: ["id"] }
        ];
      };
      campaigns: {
        Row: Campaign;
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          audience: string;
          message: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          audience?: string;
          message?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "campaigns_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] }
        ];
      };
      campaign_recipients: {
        Row: {
          id: string;
          business_id: string;
          campaign_id: string;
          customer_id: string;
          phone: string;
          generated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          campaign_id: string;
          customer_id: string;
          phone: string;
          generated_at?: string;
        };
        Update: never;
        Relationships: [
          { foreignKeyName: "campaign_recipients_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "campaign_recipients_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "campaigns"; referencedColumns: ["id"] },
          { foreignKeyName: "campaign_recipients_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          business_id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          { foreignKeyName: "audit_logs_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "audit_logs_actor_id_fkey"; columns: ["actor_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type Schema = Database[Extract<keyof Database, "public">];

export type Tables<
  TableName extends keyof Schema["Tables"],
  TableNameOptions extends { enum: boolean } = { enum: false },
> = TableNameOptions["enum"] extends true
  ? Schema["Tables"][TableName] extends { Row: infer R }
    ? R
    : never
  : Schema["Tables"][TableName] extends { Row: infer R }
    ? R
    : never;

export type TablesInsert<
  TableName extends keyof Schema["Tables"],
  TableNameOptions extends { enum: boolean } = { enum: false },
> = TableNameOptions["enum"] extends true
  ? Schema["Tables"][TableName] extends { Insert: infer I }
    ? I
    : never
  : Schema["Tables"][TableName] extends { Insert: infer I }
    ? I
    : never;

export type TablesUpdate<
  TableName extends keyof Schema["Tables"],
  TableNameOptions extends { enum: boolean } = { enum: false },
> = TableNameOptions["enum"] extends true
  ? Schema["Tables"][TableName] extends { Update: infer U }
    ? U
    : never
  : Schema["Tables"][TableName] extends { Update: infer U }
    ? U
    : never;
