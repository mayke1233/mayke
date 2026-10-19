"use client";

import Link from "next/link";
import { ActionCard } from "@/components/office/action-card";
import { useOffice } from "@/components/office/office-context";
import { brl, pct } from "@/lib/format";

export function Ads() {
  const { state } = useOffice();
  if (!state) return <p className="loading">Abrindo as campanhas…</p>;

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Ads</p>
          <h1>Verba contra o teto de ACOS</h1>
          <p className="muted">Teto atual: {pct(state.rules.acosMaxPct)}. Estoque baixo pausa. ACOS alto corta. ACOS folgado pode subir, com aprovação se o salto for grande.</p>
        </div>
      </header>
      {state.connection.mode === "mercadolivre" ? (
        <p className="banner">Mercado Ads ainda não entra na leitura. Esta tela mostra campanha quando a conta da demonstração está aberta.</p>
      ) : null}
      <div className="squad-grid">
        {state.campaigns.map((campaign) => {
          const listing = state.listings.find((item) => item.id === campaign.listingId);
          const hot = campaign.acosPct > state.rules.acosMaxPct;
          return (
            <article key={campaign.id} className="card">
              <p className="eyebrow">{campaign.status === "ativa" ? "Ativa" : "Pausada"}</p>
              <h2>{campaign.name}</h2>
              <p className={hot ? "bad" : "ok"} style={{ fontSize: "1.4rem", fontWeight: 680 }}>
                ACOS {pct(campaign.acosPct)}
              </p>
              <p className="muted">
                {brl(campaign.dailyBudget)} por dia · 7 dias {brl(campaign.spend7d)} de verba e {brl(campaign.sales7d)} de venda
              </p>
              {listing ? (
                <p style={{ marginTop: "0.5rem" }}>
                  <Link href={`/anuncios/${listing.id}`}>{listing.title}</Link>
                  <span className="faint"> · {listing.stock + listing.fullStock} un. vendáveis</span>
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
      <div className="stack" style={{ marginTop: "0.8rem" }}>
        {state.actions
          .filter((action) => action.rule === "teto_de_acos")
          .map((action) => (
            <ActionCard key={action.id} action={action} state={state} />
          ))}
      </div>
    </section>
  );
}
