# Refactoring Report

## Completed Refactors

### 1. Security — Debug Route Gated
- **File**: `app/api/debug/route.ts`
- **Change**: Added `process.env.NODE_ENV !== "development"` guard returning 403.
- **Impact**: Prevents production exposure of session cookies, refresh tokens, and org data.
- **Risk**: None — development workflows unchanged.

### 2. Duplicate Code Elimination
- **File**: `utils/order-status.ts` → **deleted**
- **File**: `components/analytics/analytics-dashboard.tsx` — updated import to `lib/orders/display.ts`
- **Change**: `getOrderStatusBadgeClass` existed in two files with diverging visual styles. Consolidated into single source of truth in `lib/orders/display.ts` (the version with `ring-1` styling).
- **Impact**: Consistent badge appearance across all order status displays.

### 3. Dead Code Removal
- **15 files deleted** across `components/`, `lib/`, `hooks/`, `utils/`, `modules/`, `types/`:
  - `components/auth/logout-button.tsx` — unused component
  - `components/dashboard/profile-form.tsx` — unused
  - `components/dashboard/settings-form.tsx` — unused
  - `components/dashboard/theme-toggle.tsx` — unused
  - `components/dashboard/dashboard-shell.tsx` — orphaned re-export
  - `components/ui/language-toggle.tsx` — unused
  - `components/ui/dynamic-form.tsx` — unused
  - `lib/supabase/storage.ts` — unused
  - `lib/supabase/session.ts` — unused
  - `lib/customers/storage.ts` — unused
  - `lib/customers/phone.ts` — unused
  - `hooks/use-order-filters.ts`, `use-customer-filters.ts`, `use-product-filters.ts` — unused hooks
  - `modules/dashboard/data/analytics.ts` — unused module
  - `utils/order-status.ts` — duplicate

### 4. Unused Export Cleanup
- **`lib/orders/display.ts`**: Removed `formatOrderAmount`, `computeOrderTotalFromRow` (unused).
- **`lib/products/display.ts`**: Removed `getStockStatusBangla`, `statusBadgeClassSimple` (unused).
- **`lib/staff/display.ts`**: Removed `memberStatusLabelBn` (unused).
- **`lib/permissions.ts`**: Removed `PermissionAction` type, `canPerformAction`, `MODULE_ACTION_LIMITS` (dead code).
- **`lib/customers/display.ts`**: Removed unused `CustomerRow` type import.
- **`lib/orders/map-row.ts`**: Removed unused `formatPaymentStatus` import.
- **`lib/reports/service.ts`**: Removed unused `MS_DAY` constant.

### 5. Type Safety Improvements
- **`components/billing/billing-view.tsx`**: Changed `icon: any` to `icon: React.ComponentType<{ className?: string }>`.
- **`components/billing/billing-view.tsx`**: Extracted `TabNav` from inline definition to standalone function component (prevents state reset on re-render).
- **`types/inventory.ts`** deleted; consumers updated to use `ProductRow as InventoryItem` from `types/products.ts`.
- **`types/dashboard.ts`**: Removed unused `AnalyticsCard` and `RecentOrder` types.

### 6. Accessibility
- **`notification-center.tsx`**: Added `aria-label="Notifications (N unread)"` to bell button.
- **`profile-dropdown.tsx`**: Added `aria-label="User menu: {name}"` to dropdown trigger.
- **`global-search.tsx`**: Added `role="dialog"`, `aria-modal="true"`, `aria-label="Search pages"`, and Tab-key focus trap.

### 7. Performance
- **`image-upload.tsx`**: Added `useEffect` cleanup to revoke blob URLs on component unmount (memory leak fix).
- **`image-upload.tsx`**: Removed unused `Upload` icon import.
- **`app/api/debug/route.ts`**: Removed unused `getSupabaseAdminClient` import.

### 8. Dashboard Enhancement
- **Created**: `premium-dashboard.tsx` — combines `AnalyticsDashboard` with 8 new widgets in responsive grid.
- **Created**: `dashboard-content.tsx` — server component wrapping data fetch + PremiumDashboard.
- **Updated**: `dashboard/page.tsx` — uses `DashboardContent` instead of `AnalyticsContent`.
- **Updated**: `dashboard-shell.tsx` header — added `GlobalSearch` (Cmd+K palette) and `NotificationCenter` (bell dropdown).

## Recommended Future Refactors

### High Priority
1. **Dynamic import recharts**: Wrap `AnalyticsDashboard` and `ReportChart` with `next/dynamic({ ssr: false })`.
2. **Server-side pagination for customers**: Add `.range()` to `customers-content.tsx` instead of loading all.
3. **Server-side pagination for inventory**: Add LIMIT clause to `inventory-content.tsx`.
4. **Analytics snapshot query optimization**: Add DB-level LIMIT/OFFSET to the 15-month query.

### Medium Priority
5. **Extract shared chart Tooltip** into a single reusable component (6 duplicate implementations).
6. **Extract shared FilterDrawer** into reusable component (3 duplicate implementations).
7. **Extract shared Pagination** into reusable component (3 duplicate implementations).
8. **Extract shared `Overlay` modal** into a UI component (2 duplicate implementations).
9. **Remove `"use client"` from 6 skeleton components** — they don't use hooks or browser APIs.

### Low Priority
10. **Add persistent caching layer** (React Cache, SWR, or custom) for analytics snapshot.
11. **Use `revalidateTag`** instead of `revalidatePath` for more granular cache invalidation.
12. **Split `settings-form.tsx`** (1,167 lines) into per-tab components.
13. **Add infinite scroll** for order lists using Intersection Observer.
