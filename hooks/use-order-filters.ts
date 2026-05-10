"use client";

import { useMemo, useState } from "react";
import { filterOrders } from "@/services/orders/orders.service";
import type { Order, OrderFilterStatus } from "@/types/orders";

export function useOrderFilters(orders: Order[]) {
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderFilterStatus>("All");

  const filteredOrders = useMemo(() => {
    return filterOrders(orders, query, selectedStatus);
  }, [orders, query, selectedStatus]);

  return {
    query,
    setQuery,
    selectedStatus,
    setSelectedStatus,
    filteredOrders,
  };
}
