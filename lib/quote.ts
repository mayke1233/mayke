import type { Listing, Promo } from "./types";

export interface Quote {
  price: number;
  buyerPrice: number;
  subsidy: number;
  fee: number;
  shipping: number;
  cost: number;
  profit: number;
  marginPct: number;
  promoName: string | null;
}

export function quoteAt(listing: Listing, price = listing.price, promo: Promo | null = listing.promo): Quote {
  const discount = promo?.sellerDiscountPct ?? 0;
  const buyerPrice = price * (1 - discount / 100);
  const subsidy = price * ((promo?.mlSubsidyPct ?? 0) / 100);
  const fee = buyerPrice * (listing.feePct / 100);
  const shipping = listing.shippingCost;
  const profit = buyerPrice - fee + subsidy - shipping - listing.cost;
  const marginPct = buyerPrice <= 0 ? -100 : (profit / buyerPrice) * 100;
  return {
    price,
    buyerPrice,
    subsidy,
    fee,
    shipping,
    cost: listing.cost,
    profit,
    marginPct,
    promoName: promo?.name ?? null,
  };
}

export function priceForMargin(listing: Pick<Listing, "cost" | "feePct" | "shippingCost">, marginPct: number): number {
  const denom = 1 - listing.feePct / 100 - marginPct / 100;
  if (denom <= 0.05) return listing.cost + listing.shippingCost;
  return Math.round(((listing.cost + listing.shippingCost) / denom) * 100) / 100;
}

export function matchPrice(listing: Listing): number | null {
  if (listing.competitorPrice == null) return null;
  const targetBuyer = listing.competitorPrice - 0.1;
  const discount = listing.promo?.sellerDiscountPct ?? 0;
  const factor = 1 - discount / 100;
  if (factor <= 0.05) return null;
  const price = Math.round((targetBuyer / factor) * 100) / 100;
  if (price >= listing.price - 0.05) return null;
  return price;
}

export function dailySales(listing: Listing): number {
  return listing.sales30d / 30;
}

export function coverDays(listing: Listing): number {
  const daily = dailySales(listing);
  if (daily <= 0) return Number.POSITIVE_INFINITY;
  return listing.fullStock / daily;
}

export function sellableUnits(listing: Listing): number {
  return listing.stock + listing.fullStock;
}
