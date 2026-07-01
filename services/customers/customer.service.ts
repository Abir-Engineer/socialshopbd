import type { CustomerListItem, CustomerFilters } from "@/types/customers";

export type CustomerFilterResult = {
  customers: CustomerListItem[];
  total: number;
  totalPages: number;
  currentPage: number;
};

export function applyCustomerFilters(
  customers: CustomerListItem[],
  filters: CustomerFilters,
  page: number,
  perPage: number,
): CustomerFilterResult {
  let filtered = [...customers];

  if (filters.query.trim()) {
    const q = filters.query.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.businessName.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  if (filters.tag) {
    filtered = filtered.filter((c) => c.tags.includes(filters.tag));
  }

  if (filters.isRepeat === "yes") {
    filtered = filtered.filter((c) => c.isRepeat);
  } else if (filters.isRepeat === "no") {
    filtered = filtered.filter((c) => !c.isRepeat);
  }

  filtered.sort((a, b) => {
    let comparison = 0;
    switch (filters.sortBy) {
      case "name":
        comparison = a.fullName.localeCompare(b.fullName);
        break;
      case "orderCount":
        comparison = a.orderCount - b.orderCount;
        break;
      case "totalSpentBdt":
        comparison = a.totalSpentBdt - b.totalSpentBdt;
        break;
      default:
        comparison = a.createdAtLabel.localeCompare(b.createdAtLabel);
    }
    return filters.sortOrder === "desc" ? -comparison : comparison;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);

  return { customers: paged, total, totalPages, currentPage: safePage };
}

export function extractTags(customers: CustomerListItem[]): string[] {
  const set = new Set<string>();
  for (const c of customers) {
    for (const t of c.tags) set.add(t);
  }
  return Array.from(set).sort();
}
