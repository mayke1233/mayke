import { AGENT_ORDER } from "./agents";
import { coverLabel, joinPt, meetingTitle, pct } from "./format";
import { coverDays, dailySales, matchPrice, priceForMargin, quoteAt, sellableUnits } from "./quote";
import type {
  AgentAction,
  AgentId,
  AgentNote,
  AppState,
  Autonomy,
  Effect,
  Listing,
  Promo,
  Rules,
} from "./types";

interface Planned {
  agent: AgentId;
  autonomy: Autonomy;
  title: string;
  reason: string;
  rule: string;
  fingerprint: string;
  listingId?: string;
  campaignId?: string;
  questionId?: string;
  beforeLabel: string;
  afterLabel: string;
  beforeMargin: number | null;
  afterMargin: number | null;
  effect: Effect | null;
}

interface Option {
  kind: "sair" | "oferta" | "buybox";
  title: string;
  reason: string;
  promo: Promo | null;
  price: number;
  marginPct: number;
  buyerPrice: number;
}

const IDLE: Record<AgentId, string> = {
  gestor: "",
  analista: "Buy Box, preço e cobertura do Full estão dentro do que eu resolvo sozinho. Nada novo nesta pauta.",
  anuncios: "Promoções estáveis. Não entro em campanha nem saio de nenhuma.",
  criativo: "Nenhum anúncio com visita alta e conversão baixa o bastante para trocar a imagem hoje.",
  ads: "As campanhas estão dentro do teto de ACOS. A verba fica onde está.",
  sac: "Não chegou pergunta com padrão seguro para responder.",
};

function classifyMove(current: number, after: number, rules: Rules): Autonomy {
  if (after < rules.minMarginPct) return "vermelho";
  if (current - after > rules.yellowDropPp + 0.05) return "amarelo";
  return "verde";
}

function slug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function promoSlug(promo: Promo | null): string {
  return promo ? slug(promo.name) : "sem-promocao";
}

function moneyLine(buyerPrice: number, margin: number, promoName: string | null): string {
  const promo = promoName ?? "sem promoção";
  return `${pct(margin)} · comprador paga ${formatBrl(buyerPrice)} · ${promo}`;
}

function best(options: Option[]): Option | null {
  return options.reduce<Option | null>((winner, option) => {
    if (!winner || option.marginPct > winner.marginPct) return option;
    return winner;
  }, null);
}

function planLiquidation(listing: Listing, rules: Rules): Planned | null {
  if (listing.sales30d > rules.liquidationMaxSales30d || listing.stock < rules.liquidationMinStock) return null;
  const nextPrice = priceForMargin(listing, rules.liquidationMarginPct);
  if (nextPrice >= listing.price - 0.5) return null;
  const current = quoteAt(listing);
  const after = quoteAt(listing, nextPrice, null);
  let autonomy: Autonomy;
  if (after.marginPct < rules.liquidationFloorPct) autonomy = "vermelho";
  else if (after.marginPct < rules.minMarginPct) autonomy = "amarelo";
  else autonomy = classifyMove(current.marginPct, after.marginPct, rules);

  const reason =
    autonomy === "vermelho"
      ? `${listing.stock} unidades e ${listing.sales30d} vendas em 30 dias. Para girar, a margem iria a ${pct(after.marginPct)}, abaixo do piso de liquidação de ${pct(rules.liquidationFloorPct)}. Nenhuma ação.`
      : `${listing.stock} unidades e ${listing.sales30d} vendas em 30 dias. O preço vai de ${formatBrl(listing.price)} para ${formatBrl(nextPrice)} e a margem fica em ${pct(after.marginPct)}. Isso fura o piso normal de ${pct(rules.minMarginPct)} e ainda respeita o piso de liquidação, então sobe para você.`;

  return {
    agent: "anuncios",
    autonomy,
    title: "Giro de estoque parado",
    reason,
    rule: "liquidacao_estoque",
    fingerprint: `liq:${listing.id}:${nextPrice.toFixed(2)}`,
    listingId: listing.id,
    beforeLabel: moneyLine(current.buyerPrice, current.marginPct, current.promoName),
    afterLabel: moneyLine(after.buyerPrice, after.marginPct, null),
    beforeMargin: current.marginPct,
    afterMargin: after.marginPct,
    effect: { type: "reprice", listingId: listing.id, price: nextPrice, promo: null },
  };
}

function planCommercial(listing: Listing, rules: Rules): Planned | null {
  if (listing.costKnown === false) return null;
  const liquidation = planLiquidation(listing, rules);
  if (liquidation) return liquidation;

  const current = quoteAt(listing);
  const options: Option[] = [];

  if (listing.promo) {
    const after = quoteAt(listing, listing.price, null);
    options.push({
      kind: "sair",
      title: "Saída de promoção",
      reason: `A promoção "${listing.promo.name}" deixa a margem em ${pct(current.marginPct)}, abaixo do piso de ${pct(rules.minMarginPct)}. Sem ela, a margem volta para ${pct(after.marginPct)}.`,
      promo: null,
      price: listing.price,
      marginPct: after.marginPct,
      buyerPrice: after.buyerPrice,
    });
  }

  for (const offer of listing.offers) {
    if (
      listing.promo &&
      offer.name === listing.promo.name &&
      offer.sellerDiscountPct === listing.promo.sellerDiscountPct &&
      offer.mlSubsidyPct === listing.promo.mlSubsidyPct
    ) {
      continue;
    }
    const after = quoteAt(listing, listing.price, offer);
    options.push({
      kind: "oferta",
      title: "Troca de promoção",
      reason: `"${offer.name}" paga ${pct(offer.mlSubsidyPct, 0)} de subsídio no desconto de ${pct(offer.sellerDiscountPct, 0)}. A margem sai de ${pct(current.marginPct)} para ${pct(after.marginPct)}.`,
      promo: offer,
      price: listing.price,
      marginPct: after.marginPct,
      buyerPrice: after.buyerPrice,
    });
  }

  const matched = matchPrice(listing);
  if (!listing.buyBox && matched != null) {
    const after = quoteAt(listing, matched, listing.promo);
    const drop = current.marginPct - after.marginPct;
    const who = listing.competitorName ?? "O concorrente";
    const priceLabel = listing.competitorPrice == null ? "" : formatBrl(listing.competitorPrice);
    options.push({
      kind: "buybox",
      title: "Preço para a Buy Box",
      reason:
        after.marginPct < rules.minMarginPct
          ? `${who} está em ${priceLabel}. Igualar derruba a margem para ${pct(after.marginPct)}, abaixo do piso de ${pct(rules.minMarginPct)}. O preço não muda.`
          : `${who} está em ${priceLabel}. Igualar deixa a margem em ${pct(after.marginPct)}, uma queda de ${drop.toFixed(1).replace(".", ",")} pontos. ${
              drop > rules.yellowDropPp ? `Passa de ${rules.yellowDropPp} pontos, então espera você.` : "A queda cabe na autonomia."
            }`,
      promo: listing.promo,
      price: matched,
      marginPct: after.marginPct,
      buyerPrice: after.buyerPrice,
    });
  }

  const viable = (option: Option) => option.marginPct >= rules.minMarginPct;
  const improves = (option: Option) => option.marginPct > current.marginPct + 0.4;
  let chosen: Option | null = null;

  if (current.marginPct < rules.minMarginPct) {
    const repairs = options.filter((option) => option.kind !== "buybox" && viable(option) && improves(option));
    chosen = best(repairs);
    if (!chosen) {
      const attempt = best(options.filter((option) => option.kind !== "buybox"));
      if (attempt && attempt.marginPct < rules.minMarginPct) chosen = attempt;
    }
  } else {
    const switches = options.filter((option) => option.kind === "oferta" && viable(option) && improves(option));
    chosen = best(switches);
    if (!chosen) chosen = options.find((option) => option.kind === "buybox") ?? null;
  }

  if (!chosen) return null;
  const autonomy: Autonomy =
    chosen.marginPct < rules.minMarginPct ? "vermelho" : classifyMove(current.marginPct, chosen.marginPct, rules);

  return {
    agent: chosen.kind === "buybox" ? "analista" : "anuncios",
    autonomy,
    title: chosen.title,
    reason: chosen.reason,
    rule: "banda_de_margem",
    fingerprint: `reprice:${listing.id}:${chosen.price.toFixed(2)}:${promoSlug(chosen.promo)}`,
    listingId: listing.id,
    beforeLabel: moneyLine(current.buyerPrice, current.marginPct, current.promoName),
    afterLabel: moneyLine(chosen.buyerPrice, chosen.marginPct, chosen.promo?.name ?? null),
    beforeMargin: current.marginPct,
    afterMargin: chosen.marginPct,
    effect: { type: "reprice", listingId: listing.id, price: chosen.price, promo: chosen.promo },
  };
}

function planCreative(listing: Listing, rules: Rules, now: Date): Planned | null {
  if (listing.creativeRefreshedAt) {
    const ageDays = (now.getTime() - new Date(listing.creativeRefreshedAt).getTime()) / 86_400_000;
    if (ageDays < rules.creativeCooldownDays) return null;
  }
  if (listing.visits30d < rules.minVisitsForCreative) return null;
  if (listing.conversionPct >= rules.lowConversionPct) return null;
  return {
    agent: "criativo",
    autonomy: "verde",
    title: "Atualização de imagens",
    reason: `Conversão de ${pct(listing.conversionPct)} em ${listing.visits30d} visitas, abaixo de ${pct(rules.lowConversionPct)}. Publico um conjunto novo de imagens no anúncio.`,
    rule: "performance_criativo",
    fingerprint: `creative:${listing.id}`,
    listingId: listing.id,
    beforeLabel: `conversão ${pct(listing.conversionPct)}`,
    afterLabel: "imagens novas publicadas",
    beforeMargin: null,
    afterMargin: null,
    effect: { type: "refresh_creative", listingId: listing.id },
  };
}

function planFull(listing: Listing, rules: Rules): Planned | null {
  if (listing.fullKnown === false) return null;
  const daily = dailySales(listing);
  if (daily <= 0) return null;
  const needed = Math.ceil(daily * rules.fullCoverDays - listing.fullStock);
  const units = Math.min(listing.stock, rules.fullReorderUnits, Math.max(0, needed));
  if (units < 8) return null;
  const cover = coverDays(listing);
  return {
    agent: "analista",
    autonomy: "amarelo",
    title: "Reposição do Full",
    reason: `O Full cobre ${coverLabel(cover)} e a régua pede ${rules.fullCoverDays} dias. Dá para enviar ${units} unidades do estoque próprio. Como isso move mercadoria, a ação espera você.`,
    rule: "reposicao_full",
    fingerprint: `full:${listing.id}:${units}`,
    listingId: listing.id,
    beforeLabel: `${listing.fullStock} un. no Full`,
    afterLabel: `enviar ${units} un.`,
    beforeMargin: null,
    afterMargin: null,
    effect: { type: "replenish_full", listingId: listing.id, units },
  };
}

function planCampaign(state: AppState, campaignId: string): Planned | null {
  const campaign = state.campaigns.find((item) => item.id === campaignId);
  if (!campaign || campaign.status !== "ativa") return null;
  const listing = state.listings.find((item) => item.id === campaign.listingId);
  if (!listing) return null;
  const rules = state.rules;
  const sellable = sellableUnits(listing);

  if (campaign.acosPct > rules.acosMaxPct && sellable <= rules.adsPauseStock) {
    return {
      agent: "ads",
      autonomy: "verde",
      title: "Pausa de campanha",
      reason: `ACOS de ${pct(campaign.acosPct)} acima do teto de ${pct(rules.acosMaxPct)}, com ${sellable} unidades vendáveis. A campanha para de consumir verba.`,
      rule: "teto_de_acos",
      fingerprint: `pause:${campaign.id}:${campaign.acosPct.toFixed(1)}`,
      listingId: listing.id,
      campaignId: campaign.id,
      beforeLabel: `ACOS ${pct(campaign.acosPct)} · ${formatBrl(campaign.dailyBudget)}/dia`,
      afterLabel: "campanha pausada",
      beforeMargin: null,
      afterMargin: null,
      effect: { type: "campaign_status", campaignId: campaign.id, status: "pausada" },
    };
  }

  if (campaign.acosPct > rules.acosMaxPct) {
    const nextBudget = Math.max(10, Math.round(campaign.dailyBudget * 0.8));
    if (nextBudget === campaign.dailyBudget) return null;
    return {
      agent: "ads",
      autonomy: "verde",
      title: "Corte de verba",
      reason: `ACOS de ${pct(campaign.acosPct)} acima do teto de ${pct(rules.acosMaxPct)}. A verba diária vai de ${formatBrl(campaign.dailyBudget)} para ${formatBrl(nextBudget)}.`,
      rule: "teto_de_acos",
      fingerprint: `budget:${campaign.id}:corte:${campaign.acosPct.toFixed(1)}`,
      listingId: listing.id,
      campaignId: campaign.id,
      beforeLabel: `${formatBrl(campaign.dailyBudget)}/dia`,
      afterLabel: `${formatBrl(nextBudget)}/dia`,
      beforeMargin: null,
      afterMargin: null,
      effect: { type: "campaign_budget", campaignId: campaign.id, dailyBudget: nextBudget },
    };
  }

  const roomy = campaign.acosPct <= rules.acosMaxPct * 0.6;
  if (roomy && sellable >= 30 && listing.sales30d >= 25) {
    const nextBudget = Math.round(campaign.dailyBudget * 1.4);
    const increasePct = ((nextBudget - campaign.dailyBudget) / campaign.dailyBudget) * 100;
    const autonomy: Autonomy = increasePct + 0.01 >= rules.budgetIncreaseYellowPct ? "amarelo" : "verde";
    return {
      agent: "ads",
      autonomy,
      title: "Aumento de verba",
      reason:
        autonomy === "amarelo"
          ? `ACOS de ${pct(campaign.acosPct)} está folgado e há estoque para vender. Subir a verba em ${Math.round(increasePct)}% passa do limite de ${rules.budgetIncreaseYellowPct}% e espera aprovação.`
          : `ACOS de ${pct(campaign.acosPct)} está folgado. A verba diária sobe de ${formatBrl(campaign.dailyBudget)} para ${formatBrl(nextBudget)}.`,
      rule: "teto_de_acos",
      fingerprint: `budget:${campaign.id}:sobe:${campaign.acosPct.toFixed(1)}`,
      listingId: listing.id,
      campaignId: campaign.id,
      beforeLabel: `${formatBrl(campaign.dailyBudget)}/dia`,
      afterLabel: `${formatBrl(nextBudget)}/dia`,
      beforeMargin: null,
      afterMargin: null,
      effect: { type: "campaign_budget", campaignId: campaign.id, dailyBudget: nextBudget },
    };
  }

  return null;
}

const TEMPLATES: { risk: "baixo" | "alto"; test: RegExp; answer: (listing: Listing) => string }[] = [
  {
    risk: "alto",
    test: /defeito|quebr|amassad|reclam|reembolso|estorno|procon|n[aã]o funciona|veio errado|tort/i,
    answer: (listing) =>
      `Olá! Sinto pelo ocorrido com ${listing.title}. Me confirma o número do pedido e uma foto do produto? Seguimos com troca ou reembolso por aqui, sem disputa.`,
  },
  {
    risk: "baixo",
    test: /\b(voltagem|bivolt|110v|220v|110|220|volts?)\b/i,
    answer: (listing) =>
      `Olá! O ${listing.title} é bivolt automático, de 110V a 220V. Pode ligar na tomada sem transformador.`,
  },
  {
    risk: "baixo",
    test: /prazo|entrega|demora|quando chega|frete/i,
    answer: () =>
      "Olá! O prazo do anúncio já considera o estoque e a sua região. Pedido no Full sai no próximo corte de envio.",
  },
  {
    risk: "baixo",
    test: /medida|tamanho|dimens|cent[ií]metro|\bcm\b/i,
    answer: (listing) =>
      `Olá! As medidas do ${listing.title} estão na ficha do anúncio, na seção de especificações. Se quiser, te confirmo a medida que você precisa encaixar.`,
  },
  {
    risk: "baixo",
    test: /garantia/i,
    answer: (listing) =>
      `Olá! O ${listing.title} tem 90 dias de garantia direta com a gente, além da garantia legal. Guarde a nota do pedido que o atendimento segue por aqui.`,
  },
];

function planQuestion(state: AppState, questionId: string): Planned | null {
  const question = state.questions.find((item) => item.id === questionId);
  if (!question || question.status !== "aberta") return null;
  const listing = state.listings.find((item) => item.id === question.listingId);
  if (!listing) return null;
  const template = TEMPLATES.find((item) => item.test.test(question.text));
  if (!template) return null;
  const answer = template.answer(listing);
  const yellow = template.risk === "alto";
  return {
    agent: "sac",
    autonomy: yellow ? "amarelo" : "verde",
    title: yellow ? "Reclamação para aprovar" : "Resposta ao comprador",
    reason: yellow
      ? `A pergunta de ${question.buyer} é uma reclamação sobre ${listing.title}. O texto fica pronto e só vai ao ar com a sua aprovação.`
      : `A pergunta de ${question.buyer} sobre ${listing.title} tem padrão claro. A resposta entra direto.`,
    rule: "atendimento",
    fingerprint: `reply:${question.id}`,
    listingId: listing.id,
    questionId: question.id,
    beforeLabel: "Pergunta aberta",
    afterLabel: yellow ? "Rascunho na fila" : "Resposta publicada",
    beforeMargin: null,
    afterMargin: null,
    effect: { type: "reply", questionId: question.id, answer },
  };
}

function formatBrl(value: number): string {
  const sign = value < 0 ? "-" : "";
  const [whole, fraction] = Math.abs(value).toFixed(2).split(".");
  return `${sign}R$ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${fraction}`;
}

function seen(state: AppState, created: AgentAction[], fingerprint: string): boolean {
  return created.some((action) => action.fingerprint === fingerprint) || state.actions.some((action) => action.fingerprint === fingerprint);
}

function applyEffect(state: AppState, effect: Effect, now: Date): void {
  if (effect.type === "reprice") {
    const listing = state.listings.find((item) => item.id === effect.listingId);
    if (!listing) return;
    listing.price = effect.price;
    listing.promo = effect.promo ? { ...effect.promo } : null;
    return;
  }
  if (effect.type === "refresh_creative") {
    const listing = state.listings.find((item) => item.id === effect.listingId);
    if (!listing) return;
    listing.creativeRefreshedAt = now.toISOString();
    listing.imageCount += 1;
    return;
  }
  if (effect.type === "campaign_status") {
    const campaign = state.campaigns.find((item) => item.id === effect.campaignId);
    if (!campaign) return;
    campaign.status = effect.status;
    return;
  }
  if (effect.type === "campaign_budget") {
    const campaign = state.campaigns.find((item) => item.id === effect.campaignId);
    if (!campaign) return;
    campaign.dailyBudget = effect.dailyBudget;
    return;
  }
  if (effect.type === "reply") {
    const question = state.questions.find((item) => item.id === effect.questionId);
    if (!question || question.status === "respondida") return;
    question.status = "respondida";
    question.answer = effect.answer;
    question.answeredBy = "sac";
    return;
  }
  const listing = state.listings.find((item) => item.id === effect.listingId);
  if (!listing) return;
  const units = Math.min(effect.units, listing.stock);
  listing.stock -= units;
  listing.fullStock += units;
}

function commit(state: AppState, created: AgentAction[], seq: { n: number }, now: Date, plan: Planned | null): void {
  if (!plan || seen(state, created, plan.fingerprint)) return;
  seq.n += 1;
  const status = plan.autonomy === "verde" ? "executada" : plan.autonomy === "amarelo" ? "pendente" : "bloqueada";
  const effect = status === "bloqueada" ? null : plan.effect;
  if (status === "executada" && effect) applyEffect(state, effect, now);
  created.push({
    id: `act_${now.getTime().toString(36)}_${seq.n}`,
    fingerprint: plan.fingerprint,
    agent: plan.agent,
    autonomy: plan.autonomy,
    status,
    title: plan.title,
    reason: plan.reason,
    listingId: plan.listingId,
    campaignId: plan.campaignId,
    questionId: plan.questionId,
    rule: plan.rule,
    beforeLabel: plan.beforeLabel,
    afterLabel: plan.afterLabel,
    beforeMargin: plan.beforeMargin,
    afterMargin: plan.afterMargin,
    effect,
    createdAt: now.toISOString(),
    resolvedAt: status === "pendente" ? null : now.toISOString(),
  });
}

function buildMeeting(state: AppState, created: AgentAction[], unmatched: string[], now: Date): void {
  const byAgent = (agent: AgentId) => created.filter((action) => action.agent === agent);
  const underTarget = state.listings.filter((listing) => quoteAt(listing).marginPct + 0.05 < state.rules.targetMarginPct).length;
  const exec = created.filter((action) => action.status === "executada").length;
  const pend = created.filter((action) => action.status === "pendente");
  const block = created.filter((action) => action.status === "bloqueada").length;
  const parts: string[] = [];
  if (created.length === 0 && unmatched.length === 0) {
    parts.push("Pauta encerrada sem ação nova. O que já estava decidido continua valendo.");
  } else {
    parts.push(
      `Fechei a rodada com ${exec} ${exec === 1 ? "ação executada" : "ações executadas"}, ${pend.length} na sua fila e ${block} ${block === 1 ? "bloqueio" : "bloqueios"}.`,
    );
    if (pend.length) parts.push(`Ficou com você: ${joinPt(pend.map((action) => action.title.toLowerCase()))}.`);
    else parts.push("Nada desta rodada precisou da sua aprovação.");
    if (block) parts.push("Onde a conta furaria o piso de margem, a ordem foi não fazer.");
  }
  if (underTarget) {
    parts.push(
      `${underTarget} ${underTarget === 1 ? "anúncio segue" : "anúncios seguem"} abaixo da meta de ${pct(state.rules.targetMarginPct)}.`,
    );
  }
  if (unmatched.length) {
    parts.push(
      `${unmatched.length === 1 ? "Uma pergunta segue" : `${unmatched.length} perguntas seguem`} sem resposta automática.`,
    );
  }
  const missingCost = state.listings.filter((listing) => listing.costKnown === false).length;
  if (missingCost) {
    parts.push(
      `${missingCost} ${missingCost === 1 ? "anúncio está" : "anúncios estão"} sem custo cadastrado. O preço deles não foi alterado.`,
    );
  }
  const summary = parts.join(" ");
  const notes: AgentNote[] = AGENT_ORDER.map((agent) => {
    if (agent === "gestor") return { agent, text: summary };
    const own = byAgent(agent);
    if (agent === "sac" && unmatched.length) {
      const extra = `${unmatched.length === 1 ? "Uma pergunta" : `${unmatched.length} perguntas`} sem padrão continuam abertas para você.`;
      const base = own.length ? own.map((action) => `${action.title}. ${action.reason}`).join(" ") : IDLE.sac;
      return { agent, text: `${base} ${extra}` };
    }
    if (!own.length) return { agent, text: IDLE[agent] };
    return { agent, text: own.map((action) => `${action.title}. ${action.reason}`).join(" ") };
  });

  state.meetings.unshift({
    id: `mtg_${now.getTime().toString(36)}`,
    ranAt: now.toISOString(),
    title: meetingTitle(now),
    summary,
    notes,
    actionIds: created.map((action) => action.id),
  });
  state.meetings = state.meetings.slice(0, 30);
}

export function runSquad(input: AppState, now = new Date()): AppState {
  const state = structuredClone(input);
  const created: AgentAction[] = [];
  const seq = { n: 0 };
  const unmatched: string[] = [];

  for (const listing of state.listings) {
    commit(state, created, seq, now, planCommercial(listing, state.rules));
    commit(state, created, seq, now, planCreative(listing, state.rules, now));
    commit(state, created, seq, now, planFull(listing, state.rules));
  }
  for (const campaign of state.campaigns) {
    commit(state, created, seq, now, planCampaign(state, campaign.id));
  }
  for (const question of state.questions) {
    if (question.status !== "aberta") continue;
    const plan = planQuestion(state, question.id);
    if (!plan) unmatched.push(question.id);
    commit(state, created, seq, now, plan);
  }

  state.actions = [...created, ...state.actions];
  buildMeeting(state, created, unmatched, now);
  return state;
}

export function decide(input: AppState, actionId: string, decision: "aprovar" | "recusar", now = new Date()): AppState {
  const current = input.actions.find((action) => action.id === actionId);
  if (!current || current.status !== "pendente") return input;
  const state = structuredClone(input);
  const action = state.actions.find((item) => item.id === actionId);
  if (!action) return input;
  if (decision === "recusar") {
    action.status = "recusada";
    action.resolvedAt = now.toISOString();
    return state;
  }
  if (action.effect) applyEffect(state, action.effect, now);
  action.status = "executada";
  action.resolvedAt = now.toISOString();
  return state;
}

export function answerQuestion(input: AppState, questionId: string, answer: string, now = new Date()): AppState {
  const text = answer.trim();
  if (text.length < 8 || text.length > 1500) return input;
  const question = input.questions.find((item) => item.id === questionId);
  if (!question || question.status === "respondida") return input;
  const state = structuredClone(input);
  const target = state.questions.find((item) => item.id === questionId);
  if (!target) return input;
  target.status = "respondida";
  target.answer = text;
  target.answeredBy = "voce";
  const pending = state.actions.find((action) => action.questionId === questionId && action.status === "pendente");
  if (pending) {
    pending.status = "executada";
    pending.resolvedAt = now.toISOString();
    pending.afterLabel = "Resposta publicada por você";
    if (pending.effect?.type === "reply") pending.effect.answer = text;
  }
  return state;
}

export function belowTarget(state: AppState): Listing[] {
  return state.listings.filter((listing) => quoteAt(listing).marginPct + 0.05 < state.rules.targetMarginPct);
}
