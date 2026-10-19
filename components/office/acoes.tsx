"use client";

import { useState } from "react";
import { ActionCard } from "@/components/office/action-card";
import { useOffice } from "@/components/office/office-context";
import type { ActionStatus } from "@/lib/types";

const FILTERS: { id: "todas" | ActionStatus; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "executada", label: "Executadas" },
  { id: "pendente", label: "Na fila" },
  { id: "bloqueada", label: "Bloqueadas" },
  { id: "recusada", label: "Recusadas" },
];

export function Acoes() {
  const { state } = useOffice();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("todas");
  if (!state) return <p className="loading">Abrindo o registro…</p>;
  const actions = state.actions.filter((action) => filter === "todas" || action.status === filter);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Ações</p>
          <h1>O que mudou, e o que não pôde mudar</h1>
        </div>
      </header>
      <div className="filters">
        {FILTERS.map((item) => (
          <button key={item.id} type="button" className={filter === item.id ? "chip on" : "chip"} onClick={() => setFilter(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="stack">
        {actions.length === 0 ? <p className="empty">Nenhuma ação neste recorte.</p> : null}
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} state={state} />
        ))}
      </div>
    </section>
  );
}
