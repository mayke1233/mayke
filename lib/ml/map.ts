import type { Listing } from "@/lib/types";

export interface OrderItemRef {
  itemId: string;
  quantity: number;
}

export function salesByItem(items: OrderItemRef[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.itemId, (totals.get(item.itemId) ?? 0) + item.quantity);
  }
  return totals;
}

export function feePercent(price: number, saleFee: number): number {
  if (price <= 0) return 0;
  return (saleFee / price) * 100;
}

export function preserveCosts(incoming: Listing, previous?: Listing): Listing {
  if (!previous || previous.costKnown !== true) return incoming;
  return {
    ...incoming,
    cost: previous.cost,
    shippingCost: previous.shippingCost,
    costKnown: true,
    creativeRefreshedAt: previous.creativeRefreshedAt,
  };
}
