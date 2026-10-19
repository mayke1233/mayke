export type Agent = {
  id: string;
  name: string;
  role: string;
  summary: string;
  tone: string;
};

export type MeetingLine = {
  agent: string;
  time: string;
  text: string;
};

export type ActionStatus = "auto" | "approved" | "rejected";

export type ActionItem = {
  id: string;
  agent: string;
  title: string;
  reason: string;
  before: string;
  after: string;
  delta: string;
  rule: string;
  time: string;
  period: string;
  marginAfter: number | null;
  status: ActionStatus;
};

export type PendingItem = Omit<ActionItem, "status" | "time" | "period"> & {
  time: string;
  period: string;
};

export const agents: Agent[] = [
  {
    id: "condutor",
    name: "Condutor",
    role: "Pauta e fechamento",
    tone: "#e0a106",
    summary:
      "Abre a reunião, cobra o reporte de cada área e fecha o dia num relatório só. Decisão que mexe em margem fora da faixa sobe para você.",
  },
  {
    id: "mercado",
    name: "Mercado",
    role: "Preço e Buy Box",
    tone: "#2f6f8f",
    summary:
      "Acompanha concorrência, Buy Box e ruptura. Ajusta o que cabe na faixa combinada e separa o que precisa de aval.",
  },
  {
    id: "vitrine",
    name: "Vitrine",
    role: "Anúncio e campanha",
    tone: "#b5522a",
    summary:
      "Entra e sai de promoção conforme subsídio e margem. Catálogo e lista tradicional passam por ele antes de qualquer adesão.",
  },
  {
    id: "atelie",
    name: "Ateliê",
    role: "Imagem e peça",
    tone: "#5f7d62",
    summary:
      "Troca foto, infográfico e selo quando a conversão cai. Publica apenas no padrão visual definido com a loja.",
  },
  {
    id: "midia",
    name: "Mídia",
    role: "Verba e anúncio pago",
    tone: "#8a5a2b",
    summary:
      "Pausa campanha sem estoque, desloca verba para o que está girando e propõe criação nova com base no dia.",
  },
  {
    id: "balcao",
    name: "Balcão",
    role: "Pergunta e reclamação",
    tone: "#3e4a3c",
    summary:
      "Responde o que está na política da loja. Pergunta que se repete vira correção de anúncio, não só mais uma resposta.",
  },
];

export const meeting: MeetingLine[] = [
  {
    agent: "Condutor",
    time: "06:40",
    text: "Pauta de terça. Três itens acima da alçada. O resto já rodou na madrugada. Mercado abre.",
  },
  {
    agent: "Mercado",
    time: "06:41",
    text: "Buy Box perdida em duas luminárias. Reposicionei a Arco 40 para R$ 189. Margem ficou em 13%, dentro da faixa.",
  },
  {
    agent: "Vitrine",
    time: "06:42",
    text: "O cupom do fim de semana puxa a manta para 6%. Parei a adesão e deixei na fila: abaixo dos 10%.",
  },
  {
    agent: "Ateliê",
    time: "06:43",
    text: "A capa de edredom convertia 0,7%. Publiquei duas fotos novas, no padrão da loja, sem selo de desconto.",
  },
  {
    agent: "Mídia",
    time: "06:44",
    text: "Pausei o anúncio do jogo de almofadas: restam 4 unidades. A verba foi para a luminária que voltou ao Buy Box.",
  },
  {
    agent: "Balcão",
    time: "06:45",
    text: "38 perguntas respondidas. Oito citaram tecido que esquenta. Sugeri uma linha no anúncio e segurei um reembolso acima da política.",
  },
  {
    agent: "Condutor",
    time: "06:47",
    text: "Pauta fechada. Relatório no escritório. O que estava na faixa já foi feito. O resto espera o seu clique.",
  },
];

export const marquee = [
  "Não é um chat esperando pergunta",
  "O squad executa dentro da regra",
  "Um relatório por dia",
  "Fora da faixa, a ação para",
  "Preço, anúncio, mídia e atendimento no mesmo turno",
  "A estratégia continua com o seu time",
  "Tudo registrado: antes, depois e a regra usada",
];

export const objectives = [
  {
    index: "01",
    title: "Devolver hora para pensar o negócio",
    text: "A rotina de conferir promoção, estoque e pergunta deixa de ocupar a manhã. O relatório chega pronto.",
  },
  {
    index: "02",
    title: "Segurar a margem combinada",
    text: "Cada ação carrega a faixa que você definiu. Abaixo dela, ninguém publica preço nem entra em campanha.",
  },
  {
    index: "03",
    title: "Fazer a conta girar fora do expediente",
    text: "O turno não fecha às 18h. Ajuste de madrugada entra no registro para você ler no dia seguinte.",
  },
];

export const pains = [
  {
    index: "01",
    title: "Cinco ferramentas, nenhuma conversa",
    text: "Uma tela para pergunta, outra para preço, outra para anúncio pago, outra para estoque. Cada uma decide no escuro. O erro de uma vira trabalho da outra.",
  },
  {
    index: "02",
    title: "O time cresce na mesma velocidade do faturamento",
    text: "A maior parte do dia ainda é conferir margem, calcular envio e responder a mesma dúvida. Quando a conta dobra, a folha dobra junto.",
  },
  {
    index: "03",
    title: "Quem devia decidir o rumo está no item a item",
    text: "Segunda de manhã, promoção por promoção, planilha aberta, estoque na outra aba. O operacional ocupa exatamente a pessoa que deveria estar fora dele.",
  },
];

export const signals = [
  {
    id: "verde",
    label: "Verde",
    name: "Autonomia",
    text: "Dentro da faixa de margem e da política da loja, o squad age e registra. Você lê o resultado no relatório, sem uma tarefa nova.",
  },
  {
    id: "amarelo",
    label: "Amarelo",
    name: "Sua alçada",
    text: "A ação fica na fila do escritório. Você aprova ou recusa. Até o clique, nada é publicado na conta.",
  },
  {
    id: "vermelho",
    label: "Vermelho",
    name: "Fora de escopo",
    text: "Tema sem regra, ou explicitamente bloqueado, não gera ação. O squad anota o caso e segue para o próximo item.",
  },
];

export const landingLog: ActionItem[] = [
  {
    id: "arco",
    agent: "Vitrine",
    title: "Troca de campanha",
    reason:
      "A promoção atual pagava pouco subsídio. A campanha da semana cobre mais e mantém a peça acima da faixa.",
    before: "margem 8%",
    after: "margem 14%",
    delta: "+6 pp",
    rule: "faixa_de_margem",
    time: "02:13",
    period: "madrugada",
    marginAfter: 14,
    status: "auto",
  },
  {
    id: "edredom",
    agent: "Ateliê",
    title: "Troca de imagens",
    reason:
      "Conversão abaixo do histórico da categoria. Duas fotos novas, no enquadramento já aprovado pela loja.",
    before: "conversão 0,7%",
    after: "peças publicadas",
    delta: "2 fotos",
    rule: "padrao_visual",
    time: "23:52",
    period: "depois do expediente",
    marginAfter: null,
    status: "auto",
  },
  {
    id: "almofada",
    agent: "Mercado",
    title: "Giro de estoque parado",
    reason:
      "Trinta dias sem venda e mais de 400 unidades. A baixa de preço ficou acima do piso, para destravar capital.",
    before: "margem 22%",
    after: "margem 12%",
    delta: "−10 pp",
    rule: "giro_de_estoque",
    time: "03:41",
    period: "madrugada",
    marginAfter: 12,
    status: "auto",
  },
];

export const doneSeed: ActionItem[] = [
  {
    id: "buybox",
    agent: "Mercado",
    title: "Reposição de Buy Box · Luminária Arco 40",
    reason: "Concorrente assumiu a caixa pela manhã. O novo preço cabe na faixa.",
    before: "R$ 209 · fora da caixa",
    after: "R$ 189 · na caixa",
    delta: "margem 13%",
    rule: "faixa_de_margem",
    time: "05:12",
    period: "antes da abertura",
    marginAfter: 13,
    status: "auto",
  },
  {
    id: "fotos",
    agent: "Ateliê",
    title: "Capa de edredom linho · fotos novas",
    reason: "Conversão em 0,7% nos últimos 14 dias, abaixo do corte da categoria.",
    before: "foto única de estúdio",
    after: "2 fotos em ambiente",
    delta: "padrão da loja",
    rule: "padrao_visual",
    time: "23:52",
    period: "ontem à noite",
    marginAfter: null,
    status: "auto",
  },
  {
    id: "pausa",
    agent: "Mídia",
    title: "Pausa de verba · Jogo de almofadas",
    reason: "Restam 4 unidades. Campanha ativa queimaria clique sem estoque para entregar.",
    before: "R$ 180/dia",
    after: "pausada",
    delta: "verba realocada",
    rule: "estoque_minimo",
    time: "04:05",
    period: "madrugada",
    marginAfter: null,
    status: "auto",
  },
  {
    id: "giro",
    agent: "Mercado",
    title: "Giro · Almofada terracota 40 cm",
    reason: "400 unidades, 30 dias sem venda. O piso de margem foi respeitado.",
    before: "margem 22%",
    after: "margem 12%",
    delta: "−10 pp",
    rule: "giro_de_estoque",
    time: "03:41",
    period: "madrugada",
    marginAfter: 12,
    status: "auto",
  },
];

export const pendingSeed: PendingItem[] = [
  {
    id: "cupom",
    agent: "Vitrine",
    title: "Adesão ao cupom da manta queen",
    reason:
      "O subsídio não cobre a queda. A margem iria de 14% para 6%, abaixo do piso de 10%.",
    before: "margem 14%",
    after: "margem 6%",
    delta: "−8 pp",
    rule: "faixa_de_margem",
    time: "06:42",
    period: "na reunião",
    marginAfter: 6,
  },
  {
    id: "reembolso",
    agent: "Balcão",
    title: "Reembolso parcial acima da política",
    reason:
      "Cliente pede 30% de volta por tecido que esquenta. A política da loja autoriza até 15% sem aval.",
    before: "teto 15%",
    after: "pedido 30%",
    delta: "fora da política",
    rule: "politica_de_pos_venda",
    time: "06:45",
    period: "na reunião",
    marginAfter: null,
  },
  {
    id: "verba",
    agent: "Mídia",
    title: "Aumento de 40% na verba da Arco 40",
    reason:
      "A peça voltou ao Buy Box, mas o estoque cobre 9 dias. Subir a verba agora pode furar antes do reabastecimento.",
    before: "R$ 220/dia",
    after: "R$ 308/dia",
    delta: "cobertura 9 dias",
    rule: "cobertura_de_estoque",
    time: "06:44",
    period: "na reunião",
    marginAfter: null,
  },
];

export const revenueBands = [
  "Ainda estruturando a operação",
  "Até R$ 80 mil por mês",
  "De R$ 80 mil a R$ 300 mil",
  "De R$ 300 mil a R$ 1 milhão",
  "Acima de R$ 1 milhão",
];
