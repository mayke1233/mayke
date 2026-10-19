export type Autonomy = "verde" | "amarelo" | "vermelho";

export type ActionStatus = "executada" | "pendente" | "recusada" | "bloqueada";

export type AgentId = "gestor" | "analista" | "anuncios" | "criativo" | "ads" | "sac";

export interface Promo {
  name: string;
  sellerDiscountPct: number;
  mlSubsidyPct: number;
}

export interface Listing {
  id: string;
  mlb: string;
  sku: string;
  title: string;
  category: string;
  price: number;
  cost: number;
  feePct: number;
  shippingCost: number;
  stock: number;
  fullStock: number;
  sales30d: number;
  visits30d: number;
  conversionPct: number;
  buyBox: boolean;
  competitorPrice: number | null;
  competitorName: string | null;
  promo: Promo | null;
  offers: Promo[];
  creativeRefreshedAt: string | null;
  imageCount: number;
  costKnown?: boolean;
  fullKnown?: boolean;
  feeEstimated?: boolean;
  permalink?: string;
}

export interface Campaign {
  id: string;
  name: string;
  listingId: string;
  status: "ativa" | "pausada";
  dailyBudget: number;
  spend7d: number;
  sales7d: number;
  acosPct: number;
}

export interface Question {
  id: string;
  listingId: string;
  buyer: string;
  text: string;
  createdAt: string;
  status: "aberta" | "respondida";
  answer: string | null;
  answeredBy: "sac" | "voce" | null;
  mlQuestionId?: number;
}

export type Effect =
  | { type: "reprice"; listingId: string; price: number; promo: Promo | null }
  | { type: "refresh_creative"; listingId: string }
  | { type: "campaign_status"; campaignId: string; status: "ativa" | "pausada" }
  | { type: "campaign_budget"; campaignId: string; dailyBudget: number }
  | { type: "reply"; questionId: string; answer: string }
  | { type: "replenish_full"; listingId: string; units: number };

export interface AgentAction {
  id: string;
  fingerprint: string;
  agent: AgentId;
  autonomy: Autonomy;
  status: ActionStatus;
  title: string;
  reason: string;
  listingId?: string;
  campaignId?: string;
  questionId?: string;
  rule: string;
  beforeLabel: string;
  afterLabel: string;
  beforeMargin: number | null;
  afterMargin: number | null;
  effect: Effect | null;
  createdAt: string;
  resolvedAt: string | null;
  delivery?: "local" | "mercadolivre" | "nao_enviada" | "falhou";
  deliveryDetail?: string;
}

export interface AgentNote {
  agent: AgentId;
  text: string;
}

export interface Meeting {
  id: string;
  ranAt: string;
  title: string;
  summary: string;
  notes: AgentNote[];
  actionIds: string[];
}

export interface Rules {
  minMarginPct: number;
  targetMarginPct: number;
  yellowDropPp: number;
  liquidationMinStock: number;
  liquidationMaxSales30d: number;
  liquidationMarginPct: number;
  liquidationFloorPct: number;
  acosMaxPct: number;
  budgetIncreaseYellowPct: number;
  lowConversionPct: number;
  minVisitsForCreative: number;
  creativeCooldownDays: number;
  fullCoverDays: number;
  fullReorderUnits: number;
  adsPauseStock: number;
}

export interface Account {
  name: string;
  nickname: string;
  medal: string;
  reputation: string;
  city: string;
}

export interface Connection {
  mode: "demonstracao" | "mercadolivre";
  userId?: number;
  syncedAt?: string | null;
  notice?: string | null;
}

export interface AppState {
  version: 1;
  account: Account;
  rules: Rules;
  listings: Listing[];
  campaigns: Campaign[];
  questions: Question[];
  actions: AgentAction[];
  meetings: Meeting[];
  connection: Connection;
}
