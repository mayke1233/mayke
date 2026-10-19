import type { ActionStatus, Autonomy } from "./types";

export const STATUS_LABEL: Record<ActionStatus, string> = {
  executada: "Executada",
  pendente: "Na fila",
  recusada: "Recusada",
  bloqueada: "Bloqueada",
};

export const AUTONOMY_LABEL: Record<Autonomy, string> = {
  verde: "Verde",
  amarelo: "Amarelo",
  vermelho: "Vermelho",
};

export const RULE_LABEL: Record<string, string> = {
  banda_de_margem: "Banda de margem",
  liquidacao_estoque: "Liquidação de estoque",
  performance_criativo: "Performance de criativo",
  reposicao_full: "Reposição do Full",
  teto_de_acos: "Teto de ACOS",
  atendimento: "Atendimento",
};
