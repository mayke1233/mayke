"use client";

import { AGENTS } from "@/lib/agents";
import { useOffice } from "@/components/office/office-context";
import { STATUS_LABEL } from "@/lib/labels";
import type { ActionStatus } from "@/lib/types";

const STATUSES: ActionStatus[] = ["executada", "pendente", "bloqueada", "recusada"];

export function Agentes() {
  const { state } = useOffice();
  if (!state) return <p className="loading">Chamando o squad…</p>;
  const notes = new Map(state.meetings[0]?.notes.map((note) => [note.agent, note.text]));

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Agentes</p>
          <h1>Quem fala na pauta</h1>
          <p className="muted">O texto de cada um é o da última reunião.</p>
        </div>
      </header>
      <div className="squad-grid">
        {AGENTS.map((agent) => {
          const own = state.actions.filter((action) => action.agent === agent.id);
          return (
            <article key={agent.id} className="card">
              <p className="eyebrow">{agent.role}</p>
              <h2>{agent.name}</h2>
              <p className="muted">{agent.mandate}</p>
              <p style={{ margin: "0.8rem 0" }}>{notes.get(agent.id)}</p>
              <div className="pills">
                {STATUSES.map((status) => {
                  const count = own.filter((action) => action.status === status).length;
                  if (!count) return null;
                  return (
                    <span key={status} className={`pill ${status}`}>
                      {count} {STATUS_LABEL[status].toLowerCase()}
                    </span>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
