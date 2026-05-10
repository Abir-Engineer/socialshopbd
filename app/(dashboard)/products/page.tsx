const products = [
  {
    name: "Premium Cotton Panjabi",
    sku: "SSB-PN-01",
    stock: 84,
    price: "BDT 1,850",
    status: "Active",
  },
  {
    name: "Herbal Face Serum",
    sku: "SSB-BT-14",
    stock: 32,
    price: "BDT 1,120",
    status: "Active",
  },
  {
    name: "Wireless Neckband Pro",
    sku: "SSB-EL-08",
    stock: 9,
    price: "BDT 2,700",
    status: "Low Stock",
  },
  {
    name: "Handcrafted Wall Clock",
    sku: "SSB-HM-22",
    stock: 0,
    price: "BDT 2,250",
    status: "Out of Stock",
  },
];

export default function ProductsPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">Monitor product inventory and listing health.</p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Add New Product
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <h2 className="mt-2 text-2xl font-semibold text-card-foreground">1,248</h2>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Active Listings</p>
          <h2 className="mt-2 text-2xl font-semibold text-card-foreground">1,109</h2>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
          <h2 className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-400">36</h2>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <h2 className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-400">12</h2>
        </article>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <p className="text-sm text-muted-foreground">Inventory Overview</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.sku} className="border-b border-border/70 last:border-b-0">
                  <td className="px-5 py-4 font-medium text-card-foreground">{product.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{product.sku}</td>
                  <td className="px-5 py-4 text-card-foreground">{product.stock}</td>
                  <td className="px-5 py-4 text-card-foreground">{product.price}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {product.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
