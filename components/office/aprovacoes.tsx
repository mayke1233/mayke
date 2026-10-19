"use client";

import { ActionCard } from "@/components/office/action-card";
import { useOffice } from "@/components/office/office-context";

export function Aprovacoes() {
  const { state } = useOffice();
  if (!state) return <p className="loading">Abrindo a fila…</p>;
  const pending = state.actions.filter((action) => action.status === "pendente");

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Aprovações</p>
          <h1>O que passou da autonomia</h1>
          <p className="muted">Aprovar aplica na conta da demonstração. Recusar tira o item da pauta até você restaurar os dados.</p>
        </div>
      </header>
      <div className="stack">
        {pending.length === 0 ? (
          <article className="card">
            <h2>Fila vazia</h2>
            <p className="muted">Nada amarelo no momento. O verde já foi executado e o vermelho ficou registrado sem mudança.</p>
          </article>
        ) : null}
        {pending.map((action) => (
          <ActionCard key={action.id} action={action} state={state} />
        ))}
      </div>
    </section>
  );
}
