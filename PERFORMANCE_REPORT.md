# Performance Report

## Bundle Size & Code Splitting
- **recharts** (~2MB) statically imported in 4 components. Should use `next/dynamic()` on `AnalyticsDashboard` and `ReportChart`.
- `components/dashboard/settings-form.tsx` at 1,167 lines is the largest component and not code-split.
- 10+ inline modal components never use `next/dynamic` — all loaded upfront.
- 6 skeleton components carry unnecessary `"use client"` directives (no hooks needed).

## Rendering Performance
- `analytics-dashboard.tsx` computes `statusPieData` inline without `useMemo` (recomputes on every render).
- Widget components (`widget-top-customers`, `widget-activity-timeline`, etc.) compute derived arrays inline without `useMemo`.
- `reports-view.tsx` defines `MetricCard` inline inside render function, re-creating it on every render.

## Memory
- **Blob URL leak** in `image-upload.tsx` — object URLs (`URL.createObjectURL`) were not cleaned up on component unmount. **Fixed**: Added `useEffect` cleanup.
- `multi-image-upload.tsx` sequentially uploads files with `await` in a `for` loop — could use `Promise.all` for parallel uploads.

## Data Fetching
- `lib/analytics/snapshot.ts` fetches **all** orders from the last 15 months with no DB-level limit, then trims client-side with `.slice(0, 10)`.
- Inventory and customers pages fetch all records unbounded (no LIMIT clause).
- No persistent data caching layer — every page load hits the database.
- No `revalidateTag` usage — all cache invalidation is via `revalidatePath` (coarse-grained).

## Key Files to Optimize
| File | Issue | Priority |
|------|-------|----------|
| `lib/analytics/snapshot.ts` | Unbounded 15-month query | High |
| `components/analytics/analytics-dashboard.tsx` | Static recharts import, no useMemo | High |
| `components/inventory/inventory-content.tsx` | No pagination/LIMIT | High |
| `components/customers/customers-content.tsx` | Client-side pagination | High |
| `components/dashboard/settings-form.tsx` | 1,167 lines, no code splitting | Medium |
| All modal components | Not dynamically imported | Medium |
