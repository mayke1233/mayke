import type { Rules } from "./types";

export const DEFAULT_RULES: Rules = {
  minMarginPct: 12,
  targetMarginPct: 22,
  yellowDropPp: 4,
  liquidationMinStock: 200,
  liquidationMaxSales30d: 0,
  liquidationMarginPct: -4,
  liquidationFloorPct: -8,
  acosMaxPct: 18,
  budgetIncreaseYellowPct: 30,
  lowConversionPct: 1.2,
  minVisitsForCreative: 400,
  creativeCooldownDays: 14,
  fullCoverDays: 12,
  fullReorderUnits: 80,
  adsPauseStock: 15,
};

const FIELDS: { key: keyof Rules; label: string; min: number; max: number }[] = [
  { key: "minMarginPct", label: "Piso de margem", min: -20, max: 80 },
  { key: "targetMarginPct", label: "Margem alvo", min: -10, max: 90 },
  { key: "yellowDropPp", label: "Queda que pede aprovação", min: 0.5, max: 40 },
  { key: "liquidationMinStock", label: "Estoque mínimo para liquidar", min: 1, max: 100000 },
  { key: "liquidationMaxSales30d", label: "Vendas máximas do item parado", min: 0, max: 100 },
  { key: "liquidationMarginPct", label: "Margem de liquidação", min: -50, max: 30 },
  { key: "liquidationFloorPct", label: "Piso da liquidação", min: -80, max: 10 },
  { key: "acosMaxPct", label: "Teto de ACOS", min: 1, max: 100 },
  { key: "budgetIncreaseYellowPct", label: "Aumento de verba que pede aprovação", min: 5, max: 300 },
  { key: "lowConversionPct", label: "Conversão baixa", min: 0.05, max: 30 },
  { key: "minVisitsForCreative", label: "Visitas mínimas para trocar imagem", min: 0, max: 100000 },
  { key: "creativeCooldownDays", label: "Intervalo entre trocas de imagem", min: 1, max: 120 },
  { key: "fullCoverDays", label: "Cobertura desejada do Full", min: 1, max: 120 },
  { key: "fullReorderUnits", label: "Máximo de unidades por envio ao Full", min: 1, max: 5000 },
  { key: "adsPauseStock", label: "Estoque que pausa anúncio pago", min: 0, max: 500 },
];

export function validateRules(input: unknown): { ok: true; rules: Rules } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Regras inválidas." };
  const source = input as Record<string, unknown>;
  const rules: Rules = { ...DEFAULT_RULES };
  for (const field of FIELDS) {
    const value = source[field.key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { ok: false, error: `${field.label} precisa ser um número.` };
    }
    if (value < field.min || value > field.max) {
      return { ok: false, error: `${field.label} fica entre ${field.min} e ${field.max}.` };
    }
    rules[field.key] = value;
  }
  if (rules.targetMarginPct <= rules.minMarginPct) {
    return { ok: false, error: "A margem alvo tem que ficar acima do piso." };
  }
  if (rules.liquidationFloorPct >= rules.liquidationMarginPct) {
    return { ok: false, error: "O piso de liquidação tem que ser menor que a margem de liquidação." };
  }
  return { ok: true, rules };
}

export const RULE_FIELDS = FIELDS;
