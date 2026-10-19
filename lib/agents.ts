import type { AgentId } from "./types";

export interface AgentProfile {
  id: AgentId;
  name: string;
  role: string;
  mandate: string;
}

export const AGENTS: AgentProfile[] = [
  {
    id: "gestor",
    name: "Gestor",
    role: "Pauta e fechamento",
    mandate:
      "Abre a reunião, cobra cada área e fecha a ata. Não mexe em preço: separa o que já foi feito do que sobe para a sua aprovação.",
  },
  {
    id: "analista",
    name: "Analista",
    role: "Preço, Buy Box e Full",
    mandate:
      "Compara o preço do comprador com o concorrente, mede a cobertura do Full e só propõe ajuste que a régua de margem deixa passar.",
  },
  {
    id: "anuncios",
    name: "Anúncios",
    role: "Catálogo e promoções",
    mandate:
      "Entra e sai de campanha pelo efeito na margem. Também gira estoque parado quando a venda sumiu e o capital ficou preso.",
  },
  {
    id: "criativo",
    name: "Criativo",
    role: "Imagem e conversão",
    mandate:
      "Olha visita e conversão. Quando o anúncio recebe gente e não vende, publica um conjunto novo de imagens dentro da regra do produto.",
  },
  {
    id: "ads",
    name: "ADS",
    role: "Verba e ACOS",
    mandate:
      "Pausa o que come verba sem estoque, corta campanha acima do teto e só aumenta orçamento quando o ACOS está folgado.",
  },
  {
    id: "sac",
    name: "SAC",
    role: "Perguntas e reclamações",
    mandate:
      "Responde o que tem padrão claro. Reclamação, defeito e reembolso ficam na fila, com o texto pronto, até você aprovar.",
  },
];

export function agentName(id: AgentId): string {
  return AGENTS.find((agent) => agent.id === id)?.name ?? id;
}

export const AGENT_ORDER: AgentId[] = ["gestor", "analista", "anuncios", "criativo", "ads", "sac"];
