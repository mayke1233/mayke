"use client";

import { useEffect, useState } from "react";
import { Semaphore } from "@/components/semaphore";
import { useOffice } from "@/components/office/office-context";
import { pct } from "@/lib/format";
import { RULE_FIELDS } from "@/lib/rules";
import type { Rules } from "@/lib/types";

const HELP: Partial<Record<keyof Rules, string>> = {
  minMarginPct: "Abaixo disso, a ação comercial não acontece.",
  targetMarginPct: "Meta do relatório. Não libera furar o piso.",
  yellowDropPp: "Queda maior que isso sobe para a fila, mesmo acima do piso.",
  liquidationMarginPct: "Margem buscada quando o item está parado.",
  liquidationFloorPct: "Abaixo disso nem a liquidação é proposta.",
  acosMaxPct: "Campanha acima disso perde verba ou pausa.",
  budgetIncreaseYellowPct: "Aumento percentual que precisa da sua aprovação.",
  lowConversionPct: "Abaixo disso, com visita suficiente, troca a imagem.",
  fullCoverDays: "Cobertura mínima do estoque no Full.",
  adsPauseStock: "Estoque vendável neste nível pausa a campanha cara.",
};

const INTEGERS = new Set<keyof Rules>([
  "liquidationMinStock",
  "liquidationMaxSales30d",
  "minVisitsForCreative",
  "creativeCooldownDays",
  "fullCoverDays",
  "fullReorderUnits",
  "adsPauseStock",
]);

export function Regras() {
  const { state, saveRules, reset, busy } = useOffice();
  const [draft, setDraft] = useState<Rules | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (state) setDraft(state.rules);
  }, [state]);

  if (!state || !draft) return <p className="loading">Abrindo a régua…</p>;

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Regras</p>
          <h1>Até onde o squad vai sozinho</h1>
          <p className="muted">Salvar não roda a reunião. A próxima pauta já usa estes números.</p>
        </div>
        <div className="row">
          <button
            className="btn"
            type="button"
            disabled={busy}
            onClick={() => {
              setNotice(null);
              void saveRules(draft).then((ok) => {
                if (ok) setNotice("Régua salva. A próxima reunião já usa estes números.");
              });
            }}
          >
            Salvar régua
          </button>
          <button
            className="btn danger"
            type="button"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("Restaurar a Casa Norte para o início da demonstração?")) return;
              setNotice(null);
              void reset();
            }}
          >
            Restaurar demonstração
          </button>
        </div>
      </header>
      {notice ? <p className="banner">{notice}</p> : null}
      <Semaphore min={draft.minMarginPct} drop={draft.yellowDropPp} floor={draft.liquidationFloorPct} />
      <p className="muted" style={{ margin: "0.9rem 0" }}>
        Com esta régua, o squad executa enquanto a margem fica em {pct(draft.minMarginPct)} ou mais e a queda não passa de{" "}
        {draft.yellowDropPp.toString().replace(".", ",")} pontos. A meta de {pct(draft.targetMarginPct)} aparece na ata, sem afrouxar o piso.
      </p>
      <form
        className="field-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void saveRules(draft);
        }}
      >
        {RULE_FIELDS.map((field) => (
          <label key={field.key} className="field card">
            <span>{field.label}</span>
            <input
              type="number"
              step={INTEGERS.has(field.key) ? "1" : "0.1"}
              min={field.min}
              max={field.max}
              value={draft[field.key]}
              onChange={(event) => {
                const value = event.target.valueAsNumber;
                setDraft({ ...draft, [field.key]: Number.isFinite(value) ? value : draft[field.key] });
                setNotice(null);
              }}
            />
            <small>{HELP[field.key] ?? `Entre ${field.min} e ${field.max}.`}</small>
          </label>
        ))}
      </form>
    </section>
  );
}
