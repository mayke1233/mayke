import { matchPrice, quoteAt, type Quote } from "./quote";
import type { Listing } from "./types";

export interface Scenario {
  id: string;
  label: string;
  quote: Quote;
  current: boolean;
}

export function scenarios(listing: Listing): Scenario[] {
  const rows: Scenario[] = [
    {
      id: "atual",
      label: listing.promo?.name ?? "Preço atual",
      quote: quoteAt(listing),
      current: true,
    },
  ];
  if (listing.promo) {
    rows.push({
      id: "sem",
      label: "Sem promoção",
      quote: quoteAt(listing, listing.price, null),
      current: false,
    });
  }
  listing.offers.forEach((offer, index) => {
    const current =
      listing.promo?.name === offer.name &&
      listing.promo.sellerDiscountPct === offer.sellerDiscountPct &&
      listing.promo.mlSubsidyPct === offer.mlSubsidyPct;
    if (current) return;
    rows.push({
      id: `oferta-${index}`,
      label: offer.name,
      quote: quoteAt(listing, listing.price, offer),
      current: false,
    });
  });
  const matched = matchPrice(listing);
  if (matched != null) {
    rows.push({
      id: "buybox",
      label: `Igualar ${listing.competitorName ?? "concorrente"}`,
      quote: quoteAt(listing, matched, listing.promo),
      current: false,
    });
  }
  return rows;
}
