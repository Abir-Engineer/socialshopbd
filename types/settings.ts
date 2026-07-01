export type Theme = "light" | "dark" | "system";
export type Locale = "en" | "bn";

export interface BusinessInfoData {
  legal_name: string;
  tax_id: string;
  address: string;
  owner_name: string;
  business_type: string;
  website: string;
  facebook: string;
}

export interface InvoiceSettings {
  prefix: string;
  template: "standard" | "minimal" | "detailed";
  show_logo: boolean;
  show_terms: boolean;
  terms: string;
  footer: string;
  due_days: number;
}

export interface CourierSettings {
  default_courier: string;
  steadfast_api_key: string;
  steadfast_secret_key: string;
  pathao_email: string;
  pathao_password: string;
  redx_api_key: string;
}

export interface TaxSettings {
  tax_rate: number;
  tax_number: string;
  tax_inclusive: boolean;
  tax_name: string;
}

export interface BackupSettings {
  auto_backup: boolean;
  backup_frequency: "daily" | "weekly" | "monthly";
  include_products: boolean;
  include_orders: boolean;
  include_customers: boolean;
  last_backup: string | null;
}

export interface NotificationPrefs {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  order_updates: boolean;
  low_stock_alerts: boolean;
  marketing_emails: boolean;
  payment_confirmations: boolean;
  daily_summary: boolean;
}

export interface ShopData {
  shop_name: string;
  slug: string;
  description: string;
  currency: string;
  phone: string;
  address: string;
  logo_url: string | null;
  invoice_prefix: string;
  default_courier: string | null;
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  prefix: "INV",
  template: "standard",
  show_logo: true,
  show_terms: false,
  terms: "",
  footer: "Thank you for your business!",
  due_days: 7,
};

export const DEFAULT_COURIER_SETTINGS: CourierSettings = {
  default_courier: "",
  steadfast_api_key: "",
  steadfast_secret_key: "",
  pathao_email: "",
  pathao_password: "",
  redx_api_key: "",
};

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  tax_rate: 0,
  tax_number: "",
  tax_inclusive: false,
  tax_name: "VAT",
};

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  auto_backup: false,
  backup_frequency: "weekly",
  include_products: true,
  include_orders: true,
  include_customers: true,
  last_backup: null,
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  email_enabled: true,
  sms_enabled: false,
  push_enabled: true,
  order_updates: true,
  low_stock_alerts: true,
  marketing_emails: false,
  payment_confirmations: true,
  daily_summary: false,
};
