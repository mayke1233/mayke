import { describe, expect, it } from "vitest";
import { answerQuestion, decide, runSquad } from "../lib/engine";
import { quoteAt } from "../lib/quote";
import { validateRules } from "../lib/rules";
import { createSeed } from "../lib/seed";
import type { AgentAction } from "../lib/types";

const NOW = new Date("2026-10-19T11:00:00.000Z");

function fresh(actions: AgentAction[]): AgentAction[] {
  return actions.filter((action) => action.createdAt === NOW.toISOString());
}

function key(action: AgentAction): string {
  return `${action.rule}:${action.listingId ?? ""}:${action.campaignId ?? ""}:${action.questionId ?? ""}:${action.status}`;
}

describe("margem", () => {
  it("trata subsídio como receita do seller, sem mudar o preço do comprador", () => {
    const listing = createSeed(NOW).listings.find((item) => item.id === "panelas");
    if (!listing) throw new Error("sem panelas");
    const current = quoteAt(listing);
    const offer = quoteAt(listing, listing.price, listing.offers[0]);
    expect(current.marginPct).toBeCloseTo(16.12, 1);
    expect(offer.buyerPrice).toBeCloseTo(current.buyerPrice, 2);
    expect(offer.marginPct).toBeGreaterThan(current.marginPct + 5);
  });
});

describe("squad", () => {
  it("executa o que cabe na régua, segura a fila e bloqueia o que fura o piso", () => {
    const seed = createSeed(NOW);
    const snapshot = structuredClone(seed);
    const next = runSquad(seed, NOW);
    expect(seed).toEqual(snapshot);

    const created = fresh(next.actions);
    expect(created.map(key).sort()).toEqual(
      [
        "banda_de_margem:panelas:::executada",
        "banda_de_margem:cama:::executada",
        "banda_de_margem:tapete:::executada",
        "banda_de_margem:kit:::pendente",
        "banda_de_margem:cadeira:::bloqueada",
        "liquidacao_estoque:garrafa:::pendente",
        "performance_criativo:ventilador:::executada",
        "reposicao_full:organizador:::pendente",
        "teto_de_acos:cadeira:camp-cadeira::executada",
        "teto_de_acos:purificador:camp-purificador::executada",
        "teto_de_acos:mochila:camp-mochila::pendente",
        "atendimento:ventilador::q-volt:executada",
        "atendimento:escorredor::q-defeito:pendente",
      ].sort(),
    );

    expect(next.listings.find((item) => item.id === "panelas")?.promo?.name).toBe("Black Friday antecipada");
    expect(next.listings.find((item) => item.id === "tapete")?.promo).toBeNull();
    expect(next.listings.find((item) => item.id === "kit")?.price).toBe(279);
    expect(next.listings.find((item) => item.id === "garrafa")?.price).toBe(89.9);
    expect(next.listings.find((item) => item.id === "cadeira")?.price).toBe(899);
    expect(next.campaigns.find((item) => item.id === "camp-purificador")?.status).toBe("pausada");
    expect(next.campaigns.find((item) => item.id === "camp-cadeira")?.dailyBudget).toBe(120);
    expect(next.campaigns.find((item) => item.id === "camp-mochila")?.dailyBudget).toBe(40);
    expect(next.questions.find((item) => item.id === "q-volt")?.status).toBe("respondida");
    expect(next.questions.find((item) => item.id === "q-defeito")?.status).toBe("aberta");
    expect(next.questions.find((item) => item.id === "q-cor")?.status).toBe("aberta");
    expect(next.listings.find((item) => item.id === "ventilador")?.creativeRefreshedAt).toBe(NOW.toISOString());
    expect(next.listings.find((item) => item.id === "fone")?.imageCount).toBe(8);
    expect(next.meetings[0].summary).toContain("meta");
    expect(next.meetings[0].notes.map((note) => note.agent)).toEqual([
      "gestor",
      "analista",
      "anuncios",
      "criativo",
      "ads",
      "sac",
    ]);

    const full = created.find((action) => action.rule === "reposicao_full");
    expect(full?.effect?.type === "replenish_full" ? full.effect.units : 0).toBe(66);
  });

  it("não repete a mesma pauta na rodada seguinte", () => {
    const first = runSquad(createSeed(NOW), NOW);
    const later = new Date(NOW.getTime() + 60_000);
    const second = runSquad(first, later);
    const known = new Set(first.actions.map((action) => action.fingerprint));
    expect(second.actions.filter((action) => !known.has(action.fingerprint))).toEqual([]);
    expect(second.meetings[0].actionIds).toEqual([]);
  });

  it("aplica a fila só depois da aprovação", () => {
    const next = runSquad(createSeed(NOW), NOW);
    const garrafa = next.actions.find((action) => action.listingId === "garrafa" && action.status === "pendente");
    const kit = next.actions.find((action) => action.listingId === "kit" && action.status === "pendente");
    const full = next.actions.find((action) => action.rule === "reposicao_full");
    if (!garrafa || !kit || !full) throw new Error("fila incompleta");

    const approved = decide(next, garrafa.id, "aprovar", NOW);
    expect(approved.listings.find((item) => item.id === "garrafa")?.price).toBeLessThan(80);
    expect(approved.actions.find((action) => action.id === garrafa.id)?.status).toBe("executada");

    const rejected = decide(next, kit.id, "recusar", NOW);
    expect(rejected.listings.find((item) => item.id === "kit")?.price).toBe(279);
    expect(rejected.actions.find((action) => action.id === kit.id)?.status).toBe("recusada");

    const restocked = decide(next, full.id, "aprovar", NOW);
    const organizer = restocked.listings.find((item) => item.id === "organizador");
    expect(organizer?.fullStock).toBe(84);
    expect(organizer?.stock).toBe(94);
  });

  it("respeita um piso mais alto e o piso de liquidação", () => {
    const seed = createSeed(NOW);
    seed.rules.minMarginPct = 18;
    seed.rules.targetMarginPct = 30;
    const raised = runSquad(seed, NOW);
    const tapete = fresh(raised.actions).find((action) => action.listingId === "tapete");
    expect(tapete?.status).toBe("bloqueada");
    expect(raised.listings.find((item) => item.id === "tapete")?.promo?.name).toBe("Queima de semana");

    const tight = createSeed(NOW);
    tight.rules.liquidationFloorPct = 0;
    const blocked = runSquad(tight, NOW);
    const garrafa = fresh(blocked.actions).find((action) => action.listingId === "garrafa");
    expect(garrafa?.status).toBe("bloqueada");
    expect(blocked.listings.find((item) => item.id === "garrafa")?.price).toBe(89.9);
  });

  it("publica a resposta escrita por você e encerra a reclamação da fila", () => {
    const next = runSquad(createSeed(NOW), NOW);
    const answered = answerQuestion(next, "q-defeito", "Paulo, vamos seguir com o reembolso. Me passa o número do pedido.", NOW);
    const question = answered.questions.find((item) => item.id === "q-defeito");
    expect(question?.status).toBe("respondida");
    expect(question?.answeredBy).toBe("voce");
    expect(answered.actions.find((action) => action.questionId === "q-defeito")?.status).toBe("executada");
    expect(answerQuestion(next, "q-defeito", "curto", NOW)).toBe(next);
  });
});

describe("regras", () => {
  it("recusa meta abaixo do piso", () => {
    const result = validateRules({ ...createSeed(NOW).rules, targetMarginPct: 5, minMarginPct: 12 });
    expect(result.ok).toBe(false);
  });
});
