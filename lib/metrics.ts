import { quoteAt } from "./quote";
import type { AppState } from "./types";

export interface OfficeMetrics {
  revenue30: number;
  profit30: number;
  marginPct: number;
  buyBoxPct: number;
  pending: number;
  openQuestions: number;
  executed: number;
  blocked: number;
}

export function metrics(state: AppState): OfficeMetrics {
  let revenue30 = 0;
  let profit30 = 0;
  let buyBox = 0;
  for (const listing of state.listings) {
    const quote = quoteAt(listing);
    revenue30 += quote.buyerPrice * listing.sales30d;
    profit30 += quote.profit * listing.sales30d;
    if (listing.buyBox) buyBox += 1;
  }
  return {
    revenue30,
    profit30,
    marginPct: revenue30 === 0 ? 0 : (profit30 / revenue30) * 100,
    buyBoxPct: state.listings.length === 0 ? 0 : (buyBox / state.listings.length) * 100,
    pending: state.actions.filter((action) => action.status === "pendente").length,
    openQuestions: state.questions.filter((question) => question.status === "aberta").length,
    executed: state.actions.filter((action) => action.status === "executada").length,
    blocked: state.actions.filter((action) => action.status === "bloqueada").length,
  };
}
