"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionCard } from "@/components/office/action-card";
import { useOffice } from "@/components/office/office-context";
import { brl, coverLabel, pct } from "@/lib/format";
import { coverDays, quoteAt } from "@/lib/quote";
import { scenarios } from "@/lib/scenarios";

export function Anuncio() {
  const params = useParams<{ id: string }>();
  const { state, refresh, busy } = useOffice();
  const listingForForm = state?.listings.find((item) => item.id === params.id);
  const [cost, setCost] = useState("");
  const [shipping, setShipping] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!listingForForm) return;
    setCost(String(listingForForm.cost));
    setShipping(String(listingForForm.shippingCost));
  }, [listingForForm]);
  if (!state) return <p className="loading">Abrindo o anúncio…</p>;
  const listing = listingForForm;
  if (!listing) {
    return (
      <p className="empty">
        Anúncio não encontrado. <Link href="/anuncios">Voltar</Link>
      </p>
    );
  }
  const quote = quoteAt(listing);
  const rows = [
    ["Preço de tabela", brl(listing.price)],
    ["Desconto ao comprador", listing.promo ? pct(listing.promo.sellerDiscountPct, 0) : "0%"],
    ["Comprador paga", brl(quote.buyerPrice)],
    ["Subsídio recebido", brl(quote.subsidy)],
    ["Tarifa do anúncio", brl(quote.fee)],
    ["Frete", brl(quote.shipping)],
    ["Custo", brl(quote.cost)],
    ["Lucro", brl(quote.profit)],
  ];
  const related = state.actions.filter((action) => action.listingId === listing.id);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{listing.category}</p>
          <h1>{listing.title}</h1>
          <p className="muted">
            {listing.mlb} · {listing.sku} · {listing.buyBox ? "com Buy Box" : `sem Buy Box${listing.competitorName ? ` · ${listing.competitorName}` : ""}`}
          </p>
        </div>
        <Link className="btn secondary" href="/anuncios">
          Anúncios
        </Link>
      </header>
      <div className="split">
        <article className="card">
          <p className="eyebrow">Conta do anúncio</p>
          <h2>{pct(quote.marginPct)}</h2>
          <div className="waterfall" style={{ marginTop: "0.8rem" }}>
            {rows.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <div className="total">
              <span>Margem</span>
              <span>{pct(quote.marginPct)}</span>
            </div>
          </div>
          {listing.costKnown === false ? <p className="banner">Sem custo, o squad não mexe neste preço.</p> : null}
          {listing.feeEstimated ? <p className="faint">A tarifa não veio da API e está estimada em 16%.</p> : null}
          <form
            className="stack"
            style={{ marginTop: "0.9rem" }}
            onSubmit={(event) => {
              event.preventDefault();
              setNotice(null);
              void fetch(`/api/listings/${listing.id}/costs`, {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ cost: Number(cost), shippingCost: Number(shipping) }),
              })
                .then(async (response) => {
                  const data = (await response.json()) as { error?: string };
                  if (!response.ok) throw new Error(data.error || "Não salvei o custo.");
                  await refresh();
                  setNotice("Custo salvo. A próxima reunião já usa este número.");
                })
                .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Falha ao salvar."));
            }}
          >
            <div className="field-grid">
              <label className="field">
                <span>Custo do produto</span>
                <input type="number" min="0" step="0.01" value={cost} onChange={(event) => setCost(event.target.value)} />
              </label>
              <label className="field">
                <span>Frete que você paga</span>
                <input type="number" min="0" step="0.01" value={shipping} onChange={(event) => setShipping(event.target.value)} />
              </label>
            </div>
            <button className="btn small" type="submit" disabled={busy}>
              Salvar custo
            </button>
            {notice ? <p className="faint">{notice}</p> : null}
          </form>
          {listing.permalink ? (
            <p style={{ marginTop: "0.7rem" }}>
              <a href={listing.permalink} target="_blank" rel="noreferrer">
                Abrir anúncio no Mercado Livre
              </a>
            </p>
          ) : null}
          <p className="faint" style={{ marginTop: "0.8rem" }}>
            Estoque próprio {listing.stock} · Full {listing.fullStock} ({coverLabel(coverDays(listing))}) · {listing.sales30d} vendas e{" "}
            {listing.visits30d} visitas em 30 dias · conversão {pct(listing.conversionPct)} · {listing.imageCount} imagens
          </p>
        </article>
        <article className="card">
          <p className="eyebrow">Cenários</p>
          <h2>O que cada caminho faz na margem</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Caminho</th>
                  <th>Comprador</th>
                  <th>Margem</th>
                </tr>
              </thead>
              <tbody>
                {scenarios(listing).map((scenario) => (
                  <tr key={scenario.id}>
                    <td>
                      {scenario.label}
                      {scenario.current ? <div className="faint">situação atual</div> : null}
                    </td>
                    <td>{brl(scenario.quote.buyerPrice)}</td>
                    <td>{pct(scenario.quote.marginPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
      <div className="stack">
        {related.length === 0 ? <p className="empty">Esse anúncio ainda não passou pela pauta.</p> : null}
        {related.map((action) => (
          <ActionCard key={action.id} action={action} state={state} />
        ))}
      </div>
    </section>
  );
}
