import type { AgentAction, AppState, Effect, Listing, Question } from "@/lib/types";
import { mlJson } from "./client";

export function publishChannel(effect: Effect): "preco" | "resposta" | "nao" {
  if (effect.type === "reprice" && !effect.promo) return "preco";
  if (effect.type === "reply") return "resposta";
  return "nao";
}

function snapshotListing(listing: Listing): Pick<Listing, "price" | "promo" | "stock" | "fullStock" | "creativeRefreshedAt" | "imageCount"> {
  return {
    price: listing.price,
    promo: listing.promo ? { ...listing.promo } : null,
    stock: listing.stock,
    fullStock: listing.fullStock,
    creativeRefreshedAt: listing.creativeRefreshedAt,
    imageCount: listing.imageCount,
  };
}

function restoreListing(listing: Listing, previous: Listing): void {
  const shot = snapshotListing(previous);
  listing.price = shot.price;
  listing.promo = shot.promo;
  listing.stock = shot.stock;
  listing.fullStock = shot.fullStock;
  listing.creativeRefreshedAt = shot.creativeRefreshedAt;
  listing.imageCount = shot.imageCount;
}

function restoreQuestion(question: Question, previous: Question): void {
  question.status = previous.status;
  question.answer = previous.answer;
  question.answeredBy = previous.answeredBy;
}

async function sendPrice(listing: Listing, price: number): Promise<void> {
  await mlJson(`/items/${listing.mlb}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ price }),
  });
}

async function sendAnswer(question: Question, text: string): Promise<void> {
  if (!question.mlQuestionId) throw new Error("Essa pergunta não veio do Mercado Livre.");
  await mlJson("/answers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question_id: question.mlQuestionId, text }),
  });
}

function listingIdOf(effect: Effect): string | undefined {
  if (effect.type === "reprice" || effect.type === "refresh_creative" || effect.type === "replenish_full") return effect.listingId;
  return undefined;
}

async function deliver(previous: AppState, next: AppState, action: AgentAction): Promise<void> {
  const effect = action.effect;
  if (!effect) return;
  const channel = publishChannel(effect);
  const touchedId = listingIdOf(effect);
  const listing = touchedId ? next.listings.find((item) => item.id === touchedId) : undefined;
  const priorListing = touchedId ? previous.listings.find((item) => item.id === touchedId) : undefined;

  if (channel === "nao") {
    if (priorListing && listing) restoreListing(listing, priorListing);
    if (effect.type === "campaign_status" || effect.type === "campaign_budget") {
      const campaign = next.campaigns.find((item) => item.id === effect.campaignId);
      const prior = previous.campaigns.find((item) => item.id === effect.campaignId);
      if (campaign && prior) {
        campaign.status = prior.status;
        campaign.dailyBudget = prior.dailyBudget;
      }
    }
    if (effect.type === "reply") {
      const question = next.questions.find((item) => item.id === effect.questionId);
      const prior = previous.questions.find((item) => item.id === effect.questionId);
      if (question && prior) restoreQuestion(question, prior);
    }
    action.delivery = "nao_enviada";
    action.deliveryDetail = "Essa ação fica na ata. A API usada aqui publica preço e resposta, não promoção, ads, imagem ou Full.";
    return;
  }

  try {
    if (effect.type === "reprice") {
      if (!listing) throw new Error("Anúncio não encontrado para publicar o preço.");
      await sendPrice(listing, effect.price);
      action.delivery = "mercadolivre";
      action.deliveryDetail = "Preço atualizado no Mercado Livre.";
      return;
    }
    if (effect.type !== "reply") return;
    const question = next.questions.find((item) => item.id === effect.questionId);
    if (!question) throw new Error("Pergunta não encontrada.");
    await sendAnswer(question, effect.answer);
    action.delivery = "mercadolivre";
    action.deliveryDetail = "Resposta publicada no Mercado Livre.";
  } catch (error) {
    if (priorListing && listing) restoreListing(listing, priorListing);
    if (effect.type === "reply") {
      const question = next.questions.find((item) => item.id === effect.questionId);
      const prior = previous.questions.find((item) => item.id === effect.questionId);
      if (question && prior) restoreQuestion(question, prior);
      action.status = "pendente";
      action.resolvedAt = null;
    }
    action.delivery = "falhou";
    action.deliveryDetail = error instanceof Error ? error.message : "O Mercado Livre recusou a publicação.";
  }
}

export async function publishExecuted(previous: AppState, next: AppState, actionIds: string[]): Promise<AppState> {
  if (next.connection.mode !== "mercadolivre") return next;
  for (const id of actionIds) {
    const action = next.actions.find((item) => item.id === id);
    if (!action || action.status !== "executada" || !action.effect) continue;
    await deliver(previous, next, action);
  }
  return next;
}

export async function publishManualAnswer(previous: AppState, next: AppState, questionId: string): Promise<AppState> {
  if (next.connection.mode !== "mercadolivre") return next;
  const question = next.questions.find((item) => item.id === questionId);
  const action = next.actions.find((item) => item.questionId === questionId && item.status === "executada");
  if (!question?.answer) return next;
  try {
    await sendAnswer(question, question.answer);
    if (action) {
      action.delivery = "mercadolivre";
      action.deliveryDetail = "Resposta publicada no Mercado Livre.";
    }
  } catch (error) {
    const prior = previous.questions.find((item) => item.id === questionId);
    if (prior) restoreQuestion(question, prior);
    if (action) {
      action.delivery = "falhou";
      action.deliveryDetail = error instanceof Error ? error.message : "O Mercado Livre recusou a resposta.";
      action.status = "pendente";
      action.resolvedAt = null;
    }
  }
  return next;
}
