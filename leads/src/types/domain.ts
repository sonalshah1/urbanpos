export type UserRole = "owner" | "staff";
export type PrintSize = "thermal-58" | "thermal-80" | "a4";
export type InvoiceStatus = "draft" | "issued" | "cancelled";
export type CampaignAudience = "all" | "vip" | "repeat" | "inactive" | "custom";
export type CampaignStatus = "draft" | "ready" | "sent" | "archived";

export type Business = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  brand_color: string;
  review_link: string | null;
  created_at: string;
};

export type Settings = {
  id: string;
  business_id: string;
  invoice_footer: string | null;
  default_print_size: PrintSize;
  whatsapp_template: string | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  email: string | null;
  status: "new" | "regular" | "vip" | "inactive";
  lifetime_value: number;
  visit_count: number;
  last_purchase_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerTag = {
  id: string;
  business_id: string;
  name: string;
  color: string;
};

export type CustomerNote = {
  id: string;
  business_id: string;
  customer_id: string;
  body: string;
  created_by: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  business_id: string;
  customer_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number;
  discount: number;
  total: number;
  print_size: PrintSize;
  review_link: string | null;
  issued_at: string;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  business_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type Campaign = {
  id: string;
  business_id: string;
  name: string;
  audience: CampaignAudience;
  message: string;
  status: CampaignStatus;
  created_at: string;
};

export type DashboardMetrics = {
  todaysRevenue: number;
  todaysCustomers: number;
  totalCustomers: number;
  repeatCustomers: number;
  recentInvoices: Invoice[];
};
