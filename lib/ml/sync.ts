import type { AppState, Listing, Question } from "@/lib/types";
import { mlJson, rememberNickname } from "./client";
import { feePercent, preserveCosts, salesByItem, type OrderItemRef } from "./map";

const ITEM_CAP = 40;

interface MlUser {
  id: number;
  nickname?: string;
  seller_reputation?: { level_id?: string | null; power_seller_status?: string | null };
  address?: { city?: string | null; state?: string | null };
}

interface MlItem {
  id: string;
  title: string;
  price: number;
  currency_id?: string;
  available_quantity?: number;
  category_id?: string;
  listing_type_id?: string;
  permalink?: string;
  seller_custom_field?: string | null;
  pictures?: unknown[];
  status?: string;
}

interface MlQuestion {
  id: number;
  text?: string;
  item_id?: string;
  date_created?: string;
  status?: string;
}

function medal(status?: string | null): string {
  if (status === "platinum") return "MercadoLíder Platinum";
  if (status === "gold") return "MercadoLíder Gold";
  if (status === "silver") return "MercadoLíder";
  return "Sem medalha";
}

function reputation(level?: string | null): string {
  if (!level) return "sem reputação";
  if (level.includes("green")) return "verde";
  if (level.includes("yellow")) return "amarela";
  if (level.includes("orange")) return "laranja";
  if (level.includes("red")) return "vermelha";
  return level;
}

async function itemIds(userId: number): Promise<string[]> {
  const ids: string[] = [];
  for (let offset = 0; ids.length < ITEM_CAP; offset += 50) {
    const page = await mlJson<{ results?: string[]; paging?: { total?: number } }>(
      `/users/${userId}/items/search?status=active&limit=50&offset=${offset}`,
    );
    const batch = page.results ?? [];
    ids.push(...batch);
    if (batch.length < 50 || ids.length >= (page.paging?.total ?? ids.length)) break;
  }
  return ids.slice(0, ITEM_CAP);
}

async function loadItems(ids: string[]): Promise<MlItem[]> {
  const items: MlItem[] = [];
  for (let index = 0; index < ids.length; index += 20) {
    const chunk = ids.slice(index, index + 20);
    const rows = await mlJson<Array<{ code?: number; body?: MlItem }>>(`/items?ids=${chunk.join(",")}`);
    for (const row of rows) {
      if (row.code === 200 && row.body?.id && row.body.currency_id !== "USD") items.push(row.body);
    }
  }
  return items;
}

async function salesSince(userId: number, fromIso: string): Promise<{ sales: Map<string, number>; failed: boolean }> {
  const refs: OrderItemRef[] = [];
  try {
    for (let offset = 0; offset < 200; offset += 50) {
      const page = await mlJson<{
        results?: Array<{ order_items?: Array<{ item?: { id?: string }; quantity?: number }> }>;
      }>(
        `/orders/search?seller=${userId}&order.status=paid&order.date_created.from=${encodeURIComponent(fromIso)}&limit=50&offset=${offset}`,
      );
      const results = page.results ?? [];
      for (const order of results) {
        for (const line of order.order_items ?? []) {
          if (line.item?.id) refs.push({ itemId: line.item.id, quantity: line.quantity ?? 1 });
        }
      }
      if (results.length < 50) break;
    }
  } catch {
    return { sales: new Map(), failed: true };
  }
  return { sales: salesByItem(refs), failed: false };
}

async function feeFor(item: MlItem): Promise<{ feePct: number; estimated: boolean }> {
  if (!item.price || !item.category_id) return { feePct: 16, estimated: true };
  try {
    const rows = await mlJson<Array<{ sale_fee_amount?: number }>>(
      `/sites/MLB/listing_prices?price=${item.price}&category_id=${item.category_id}${item.listing_type_id ? `&listing_type_id=${item.listing_type_id}` : ""}`,
    );
    const amount = rows[0]?.sale_fee_amount;
    if (typeof amount !== "number") return { feePct: 16, estimated: true };
    return { feePct: feePercent(item.price, amount), estimated: false };
  } catch {
    return { feePct: 16, estimated: true };
  }
}

function toListing(item: MlItem, sales: number, feePct: number, estimated: boolean, previous?: Listing): Listing {
  return preserveCosts(
    {
      id: item.id.toLowerCase(),
      mlb: item.id,
      sku: item.seller_custom_field || item.id,
      title: item.title,
      category: item.category_id || "Mercado Livre",
      price: item.price,
      cost: 0,
      feePct,
      shippingCost: 0,
      stock: item.available_quantity ?? 0,
      fullStock: 0,
      sales30d: sales,
      visits30d: 0,
      conversionPct: 0,
      buyBox: true,
      competitorPrice: null,
      competitorName: null,
      promo: null,
      offers: [],
      creativeRefreshedAt: null,
      imageCount: item.pictures?.length ?? 0,
      costKnown: false,
      fullKnown: false,
      feeEstimated: estimated,
      permalink: item.permalink,
    },
    previous,
  );
}

export async function syncAccount(current: AppState): Promise<AppState> {
  const user = await mlJson<MlUser>("/users/me");
  await rememberNickname(user.nickname ?? "");
  const ids = await itemIds(user.id);
  const items = await loadItems(ids);
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const sold = await salesSince(user.id, from.toISOString());
  const ordersMissing = sold.failed;
  const previousByMlb = new Map(current.listings.map((listing) => [listing.mlb, listing]));
  const listings: Listing[] = [];
  let estimatedFees = 0;
  for (const item of items) {
    const fee = await feeFor(item);
    if (fee.estimated) estimatedFees += 1;
    const units = sold.sales.get(item.id) ?? 0;
    listings.push(toListing(item, units, fee.feePct, fee.estimated, previousByMlb.get(item.id)));
  }

  let questions: Question[] = current.questions.filter((question) => question.status === "respondida");
  try {
    const found = await mlJson<{ questions?: MlQuestion[] }>(
      `/questions/search?seller_id=${user.id}&status=UNANSWERED&api_version=4`,
    );
    const known = new Set(listings.map((listing) => listing.mlb));
    const open = (found.questions ?? [])
      .filter((question) => question.item_id && known.has(question.item_id))
      .map<Question>((question) => ({
        id: `mlq-${question.id}`,
        mlQuestionId: question.id,
        listingId: question.item_id!.toLowerCase(),
        buyer: "Comprador",
        text: question.text || "Pergunta sem texto.",
        createdAt: question.date_created || new Date().toISOString(),
        status: "aberta",
        answer: null,
        answeredBy: null,
      }));
    const answeredIds = new Set(questions.map((question) => question.id));
    questions = [...open.filter((question) => !answeredIds.has(question.id)), ...questions];
  } catch {
    // a conta segue sem a fila de perguntas se a API recusar
  }

  const notices: string[] = [];
  if (ids.length >= ITEM_CAP) notices.push(`A leitura trouxe os primeiros ${ITEM_CAP} anúncios ativos.`);
  if (ordersMissing) notices.push("Não foi possível ler as vendas dos últimos 30 dias. Itens sem venda registrada entram como zero.");
  if (estimatedFees) notices.push("Algumas tarifas não voltaram da API e ficaram estimadas em 16%.");
  notices.push("Cadastre custo e frete em cada anúncio. Sem custo, o squad não altera preço.");
  notices.push("Preço e resposta são publicados na conta. Promoção, anúncio pago, imagem e envio ao Full ficam só na ata.");

  const switching = current.connection.mode !== "mercadolivre";
  const city = [user.address?.city, user.address?.state].filter(Boolean).join(", ");
  return {
    ...current,
    account: {
      name: user.nickname || "Conta Mercado Livre",
      nickname: user.nickname || String(user.id),
      medal: medal(user.seller_reputation?.power_seller_status),
      reputation: reputation(user.seller_reputation?.level_id),
      city: city || "Mercado Livre",
    },
    listings,
    campaigns: [],
    questions,
    actions: switching ? [] : current.actions,
    meetings: switching ? [] : current.meetings,
    connection: {
      mode: "mercadolivre",
      userId: user.id,
      syncedAt: new Date().toISOString(),
      notice: notices.join(" "),
    },
  };
}
