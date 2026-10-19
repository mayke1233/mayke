"use client";

import Link from "next/link";
import { agentName } from "@/lib/agents";
import { pp, when } from "@/lib/format";
import { AUTONOMY_LABEL, RULE_LABEL, STATUS_LABEL } from "@/lib/labels";
import type { AgentAction, AppState } from "@/lib/types";
import { useOffice } from "./office-context";

export function ActionCard({ action, state }: { action: AgentAction; state: AppState }) {
  const office = useOffice();
  const listing = state.listings.find((item) => item.id === action.listingId);
  const question = state.questions.find((item) => item.id === action.questionId);
  const delta =
    action.beforeMargin != null && action.afterMargin != null ? action.afterMargin - action.beforeMargin : null;

  return (
    <article className={`action ${action.autonomy}`}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="pills">
          <span className={`pill ${action.autonomy}`}>{AUTONOMY_LABEL[action.autonomy]}</span>
          <span className={`pill ${action.status}`}>{STATUS_LABEL[action.status]}</span>
          <span className="pill">{agentName(action.agent)}</span>
        </div>
        <span className="faint">{when(action.createdAt)}</span>
      </div>
      <h3 style={{ marginTop: "0.45rem" }}>{action.title}</h3>
      <p className="muted" style={{ marginTop: "0.25rem" }}>
        {listing ? (
          <Link href={`/anuncios/${listing.id}`}>
            {listing.title}
          </Link>
        ) : null}{" "}
        {question ? <span>“{question.text}”</span> : null}
      </p>
      <p style={{ marginTop: "0.45rem" }}>{action.reason}</p>
      <p className="delta" style={{ marginTop: "0.45rem" }}>
        {action.beforeLabel} → {action.afterLabel}
        {delta != null ? ` · ${pp(delta)}` : ""}
      </p>
      <p className="faint">{RULE_LABEL[action.rule] ?? action.rule}</p>
      {action.status === "pendente" ? (
        <div className="row" style={{ marginTop: "0.7rem" }}>
          <button className="btn small" type="button" disabled={office.busy} onClick={() => void office.decide(action.id, "aprovar")}>
            Aprovar
          </button>
          <button
            className="btn secondary small"
            type="button"
            disabled={office.busy}
            onClick={() => void office.decide(action.id, "recusar")}
          >
            Recusar
          </button>
        </div>
      ) : null}
    </article>
  );
}
