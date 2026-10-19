"use client";

import Link from "next/link";
import { ActionCard } from "@/components/office/action-card";
import { useOffice } from "@/components/office/office-context";
import { brl, pct } from "@/lib/format";
import { metrics } from "@/lib/metrics";

export function Painel() {
  const { state } = useOffice();
  if (!state) return <p className="loading">Abrindo a Casa Norte…</p>;
  const numbers = metrics(state);
  const meeting = state.meetings[0];
  const pending = state.actions.filter((action) => action.status === "pendente");
  const recent = state.actions.slice(0, 5);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Painel</p>
          <h1>{state.account.name}</h1>
          <p className="muted">O squad opera esta conta de demonstração. Rode a reunião para ver a pauta de agora.</p>
        </div>
      </header>
      <div className="kpis">
        <article className="kpi">
          <span>Faturamento em 30 dias</span>
          <strong>{brl(numbers.revenue30)}</strong>
        </article>
        <article className="kpi">
          <span>Lucro estimado</span>
          <strong>{brl(numbers.profit30)}</strong>
        </article>
        <article className="kpi">
          <span>Margem média</span>
          <strong>{pct(numbers.marginPct)}</strong>
        </article>
        <article className="kpi">
          <span>Na sua fila</span>
          <strong>{numbers.pending}</strong>
        </article>
      </div>
      <p className="faint">
        Buy Box em {pct(numbers.buyBoxPct, 0)} dos anúncios · {numbers.openQuestions}{" "}
        {numbers.openQuestions === 1 ? "pergunta aberta" : "perguntas abertas"}
      </p>
      <div className="split">
        <article className="card">
          <p className="eyebrow">Última reunião</p>
          <h2>{meeting?.title ?? "Ainda sem ata"}</h2>
          <p style={{ margin: "0.6rem 0" }}>{meeting?.summary}</p>
          {meeting ? (
            <Link className="btn secondary small" href="/reuniao">
              Ler a ata
            </Link>
          ) : null}
        </article>
        <article className="card">
          <p className="eyebrow">Fila amarela</p>
          <h2>{pending.length === 0 ? "Nada esperando você" : `${pending.length} para decidir`}</h2>
          <div className="stack" style={{ marginTop: "0.8rem" }}>
            {pending.slice(0, 3).map((action) => (
              <ActionCard key={action.id} action={action} state={state} />
            ))}
            {pending.length === 0 ? (
              <p className="empty">O que estava dentro da régua já foi executado. Rode o squad de novo se mudou uma regra.</p>
            ) : null}
            {pending.length > 3 ? (
              <Link href="/aprovacoes">Ver as {pending.length} aprovações</Link>
            ) : null}
          </div>
        </article>
      </div>
      <article className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>Registro</h2>
          <Link href="/acoes">Abrir o log</Link>
        </div>
        <div className="stack" style={{ marginTop: "0.8rem" }}>
          {recent.map((action) => (
            <ActionCard key={action.id} action={action} state={state} />
          ))}
        </div>
      </article>
    </section>
  );
}
