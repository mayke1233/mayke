"use client";

import { useState } from "react";
import { useOffice } from "@/components/office/office-context";
import { agentName } from "@/lib/agents";
import { brl, pct, pp, when } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import { metrics } from "@/lib/metrics";

export function Relatorio() {
  const { state } = useOffice();
  const [selected, setSelected] = useState(0);
  if (!state) return <p className="loading">Montando o relatório…</p>;
  const meeting = state.meetings[selected] ?? state.meetings[0];
  const numbers = metrics(state);
  const actions = (meeting?.actionIds ?? [])
    .map((id) => state.actions.find((action) => action.id === id))
    .filter((action) => action != null);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Relatório</p>
          <h1>O dia, em uma página</h1>
        </div>
        <div className="row">
          {state.meetings.length > 1 ? (
            <select value={selected} onChange={(event) => setSelected(Number(event.target.value))} aria-label="Escolher reunião">
              {state.meetings.map((item, index) => (
                <option key={item.id} value={index}>
                  {item.title}
                </option>
              ))}
            </select>
          ) : null}
          <button className="btn secondary" type="button" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
      </header>
      <article className="card">
        <p className="eyebrow">{state.account.name}</p>
        <h2>{meeting?.title}</h2>
        <p className="muted">{meeting ? when(meeting.ranAt) : ""}</p>
        <p style={{ margin: "0.8rem 0 1rem" }}>{meeting?.summary}</p>
        <div className="kpis">
          <div className="kpi">
            <span>Faturamento 30d</span>
            <strong>{brl(numbers.revenue30)}</strong>
          </div>
          <div className="kpi">
            <span>Margem</span>
            <strong>{pct(numbers.marginPct)}</strong>
          </div>
          <div className="kpi">
            <span>Fila</span>
            <strong>{numbers.pending}</strong>
          </div>
          <div className="kpi">
            <span>Buy Box</span>
            <strong>{pct(numbers.buyBoxPct, 0)}</strong>
          </div>
        </div>
        <div className="transcript">
          {meeting?.notes.map((note) => (
            <div key={note.agent} className="note">
              <strong>{agentName(note.agent)}</strong>
              <p>{note.text}</p>
            </div>
          ))}
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Ação</th>
                <th>Status</th>
                <th>Antes</th>
                <th>Depois</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id}>
                  <td>
                    {action.title}
                    <div className="faint">{agentName(action.agent)}</div>
                  </td>
                  <td>{STATUS_LABEL[action.status]}</td>
                  <td>{action.beforeMargin != null ? pct(action.beforeMargin) : action.beforeLabel}</td>
                  <td>
                    {action.afterMargin != null ? pct(action.afterMargin) : action.afterLabel}
                    {action.beforeMargin != null && action.afterMargin != null ? (
                      <div className="faint">{pp(action.afterMargin - action.beforeMargin)}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {actions.length === 0 ? <p className="empty">Sem ações nesta ata.</p> : null}
        </div>
      </article>
    </section>
  );
}
