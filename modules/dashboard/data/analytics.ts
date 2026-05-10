import type { AnalyticsCard, RecentOrder } from "@/types/dashboard";

export const analyticsCards: AnalyticsCard[] = [
  { title: "Total Orders", value: "18,245", growth: "+9.4% this month" },
  { title: "Revenue", value: "BDT 12.8M", growth: "+18.2% from last month" },
  { title: "Pending Orders", value: "326", growth: "Requires attention" },
  { title: "Delivered Orders", value: "16,942", growth: "92.8% fulfillment rate" },
  { title: "Inventory Status", value: "Healthy", growth: "36 low-stock products" },
];

export const recentOrders: RecentOrder[] = [
  { id: "ORD-9012", customer: "Ayesha Rahman", amount: "BDT 2,450", status: "Delivered" },
  { id: "ORD-9013", customer: "Rafi Hasan", amount: "BDT 1,320", status: "Processing" },
  { id: "ORD-9014", customer: "Nusrat Jahan", amount: "BDT 3,900", status: "Packed" },
  { id: "ORD-9015", customer: "Imran Kabir", amount: "BDT 870", status: "Pending" },
];
