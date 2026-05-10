import { analyticsCards, recentOrders } from "@/modules/dashboard/data/analytics";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {analyticsCards.map((item) => (
          <article key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{item.title}</p>
            <h3 className="mt-2 text-2xl font-semibold text-card-foreground">{item.value}</h3>
            <p className="mt-2 text-xs text-muted-foreground">{item.growth}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-card-foreground">Sales Overview</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Last 30 days
            </span>
          </div>
          <div className="mt-5 h-64 rounded-lg border border-dashed border-border bg-gradient-to-br from-blue-100/70 to-indigo-100/60 p-5 dark:from-blue-950/30 dark:to-indigo-950/30">
            <div className="flex h-full items-end gap-2">
              {[45, 60, 38, 72, 55, 80, 66, 90, 62, 70, 88, 76].map((height, index) => (
                <div
                  key={height + index}
                  className="flex-1 rounded-t-md bg-blue-500/80"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">Top Categories</h2>
          <ul className="mt-5 space-y-4">
            {[
              { name: "Fashion", share: "34%" },
              { name: "Beauty", share: "27%" },
              { name: "Electronics", share: "21%" },
              { name: "Home Decor", share: "18%" },
            ].map((category) => (
              <li key={category.name} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{category.name}</span>
                <span className="text-sm font-semibold text-card-foreground">{category.share}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-card-foreground">Recent Orders</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-3 py-3 font-medium">Order ID</th>
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Amount</th>
                <th className="px-3 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-border/70 last:border-b-0">
                  <td className="px-3 py-3 font-medium text-card-foreground">{order.id}</td>
                  <td className="px-3 py-3 text-muted-foreground">{order.customer}</td>
                  <td className="px-3 py-3 text-card-foreground">{order.amount}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
