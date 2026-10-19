"use client";

import { useState } from "react";
import { ActionCard } from "@/components/office/action-card";
import { useOffice } from "@/components/office/office-context";
import { agentName } from "@/lib/agents";
import { when } from "@/lib/format";

export function Reuniao() {
  const { state } = useOffice();
  const [selected, setSelected] = useState(0);
  if (!state) return <p className="loading">Abrindo a ata…</p>;
  const meeting = state.meetings[selected] ?? state.meetings[0];
  if (!meeting) return <p className="empty">Nenhuma reunião ainda. Rode o squad.</p>;
  const actions = meeting.actionIds
    .map((id) => state.actions.find((action) => action.id === id))
    .filter((action) => action != null);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Reunião</p>
          <h1>{meeting.title}</h1>
          <p className="muted">{when(meeting.ranAt)} · a pauta não entra na sua agenda</p>
        </div>
        {state.meetings.length > 1 ? (
          <label className="field">
            <span>Atas</span>
            <select value={selected} onChange={(event) => setSelected(Number(event.target.value))}>
              {state.meetings.map((item, index) => (
                <option key={item.id} value={index}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </header>
      <article className="card transcript">
        {meeting.notes.map((note) => (
          <div key={note.agent} className="note">
            <strong>{agentName(note.agent)}</strong>
            <p>{note.text}</p>
          </div>
        ))}
      </article>
      <div className="stack" style={{ marginTop: "0.8rem" }}>
        {actions.length === 0 ? <p className="empty">Essa rodada não gerou ação nova.</p> : null}
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} state={state} />
        ))}
      </div>
    </section>
  );
}
