export type NavigationItem = {
  name: string;
  href: string;
  icon: string;
};

export type AnalyticsCard = {
  title: string;
  value: string;
  growth: string;
};

export type RecentOrder = {
  id: string;
  customer: string;
  amount: string;
  status: string;
};
