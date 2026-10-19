import { describe, expect, it } from "vitest";
import { runSquad } from "../lib/engine";
import { codeChallenge, codeVerifier } from "../lib/ml/client";
import { isRedirectUri } from "../lib/ml/config";
import { feePercent, preserveCosts } from "../lib/ml/map";
import { publishChannel } from "../lib/ml/publish";
import { createSeed } from "../lib/seed";

const NOW = new Date("2026-10-19T11:00:00.000Z");

describe("conta do Mercado Livre", () => {
  it("não altera preço de anúncio sem custo", () => {
    const seed = createSeed(NOW);
    const bottle = seed.listings.find((item) => item.id === "garrafa");
    if (!bottle) throw new Error("sem garrafa");
    bottle.costKnown = false;
    const next = runSquad(seed, NOW);
    const fresh = next.actions.filter((action) => action.createdAt === NOW.toISOString());
    expect(fresh.some((action) => action.listingId === "garrafa")).toBe(false);
    expect(next.meetings[0]?.summary).toContain("sem custo");
  });

  it("não pede reposição de Full quando o estoque do Full é desconhecido", () => {
    const seed = createSeed(NOW);
    const item = seed.listings.find((listing) => listing.id === "organizador");
    if (!item) throw new Error("sem organizador");
    item.fullKnown = false;
    const next = runSquad(seed, NOW);
    const fresh = next.actions.filter((action) => action.createdAt === NOW.toISOString());
    expect(fresh.some((action) => action.rule === "reposicao_full")).toBe(false);
  });

  it("preserva custo já informado e separa o que pode ser publicado", () => {
    const seed = createSeed(NOW).listings[0];
    if (!seed) throw new Error("sem anúncio");
    const kept = preserveCosts({ ...seed, price: 10, cost: 0, costKnown: false, shippingCost: 0 }, { ...seed, cost: 40, shippingCost: 12, costKnown: true });
    expect(kept.cost).toBe(40);
    expect(kept.shippingCost).toBe(12);
    expect(kept.price).toBe(10);
    expect(feePercent(100, 16)).toBe(16);
    expect(publishChannel({ type: "reprice", listingId: "a", price: 10, promo: null })).toBe("preco");
    expect(publishChannel({ type: "reply", questionId: "q", answer: "ok" })).toBe("resposta");
    expect(publishChannel({ type: "refresh_creative", listingId: "a" })).toBe("nao");
    expect(isRedirectUri("http://localhost:3001/api/ml/callback")).toBe(true);
    expect(isRedirectUri("http://localhost:3001/painel")).toBe(false);
    expect(codeChallenge(codeVerifier())).toHaveLength(43);
  });
});
