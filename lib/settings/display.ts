export const CURRENCY_OPTIONS = [
  { value: "BDT", label: "BDT (৳)", symbol: "৳" },
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "INR", label: "INR (₹)", symbol: "₹" },
] as const;

export const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "system", label: "System", icon: "💻" },
] as const;

export const LOCALE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা" },
] as const;

export const BUSINESS_TYPE_OPTIONS = [
  { value: "Retail", label: "Retail" },
  { value: "Wholesale", label: "Wholesale" },
  { value: "Service", label: "Service" },
  { value: "Marketplace", label: "Marketplace" },
  { value: "Manufacturing", label: "Manufacturing" },
] as const;

export const INVOICE_TEMPLATE_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "minimal", label: "Minimal" },
  { value: "detailed", label: "Detailed" },
] as const;

export const BACKUP_FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

export const COURIER_OPTIONS = [
  { value: "steadfast", label: "Steadfast" },
  { value: "pathao", label: "Pathao" },
  { value: "redx", label: "RedX" },
  { value: "sundarban", label: "Sundarban" },
  { value: "others", label: "Others" },
] as const;
