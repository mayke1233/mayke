"use client";

import Link from "next/link";
import { useState } from "react";
import { useOffice } from "@/components/office/office-context";
import { when } from "@/lib/format";

export function Sac() {
  const { state, reply, busy } = useOffice();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  if (!state) return <p className="loading">Abrindo as perguntas…</p>;

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">SAC</p>
          <h1>Perguntas da conta</h1>
          <p className="muted">Padrão claro o squad responde. Reclamação fica com rascunho até você publicar. O que não tem padrão continua aberto.</p>
        </div>
      </header>
      <div className="stack">
        {state.questions.map((question) => {
          const listing = state.listings.find((item) => item.id === question.listingId);
          const pending = state.actions.find((action) => action.questionId === question.id && action.status === "pendente");
          const suggested = pending?.effect?.type === "reply" ? pending.effect.answer : "";
          const value = drafts[question.id] ?? suggested;
          return (
            <article key={question.id} className="card question">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{question.buyer}</strong>
                <span className="faint">{when(question.createdAt)}</span>
              </div>
              <p className="quote">{question.text}</p>
              {listing ? (
                <Link href={`/anuncios/${listing.id}`} className="faint">
                  {listing.title}
                </Link>
              ) : null}
              {question.status === "respondida" ? (
                <p>
                  <span className="pill executada">{question.answeredBy === "voce" ? "Você" : "SAC"}</span> {question.answer}
                </p>
              ) : (
                <>
                  <label className="field">
                    <span>{suggested ? "Rascunho do SAC" : "Sua resposta"}</span>
                    <textarea rows={4} value={value} onChange={(event) => setDrafts((current) => ({ ...current, [question.id]: event.target.value }))} />
                  </label>
                  <button className="btn small" type="button" disabled={busy || value.trim().length < 8} onClick={() => void reply(question.id, value)}>
                    Publicar resposta
                  </button>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
