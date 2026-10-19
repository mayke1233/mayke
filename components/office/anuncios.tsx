"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useOffice } from "@/components/office/office-context";
import { brl, coverLabel, pct } from "@/lib/format";
import { coverDays, quoteAt } from "@/lib/quote";
import type { Listing, Rules } from "@/lib/types";

type Filter = "todos" | "curta" | "buybox" | "parado" | "full";

function tone(margin: number, rules: Rules): string {
  if (margin < rules.minMarginPct) return "bad";
  if (margin < rules.targetMarginPct) return "warn";
  return "ok";
}

function matchFilter(listing: Listing, filter: Filter, rules: Rules): boolean {
  const quote = quoteAt(listing);
  if (filter === "curta") return quote.marginPct < rules.targetMarginPct;
  if (filter === "buybox") return !listing.buyBox;
  if (filter === "parado") return listing.sales30d <= rules.liquidationMaxSales30d && listing.stock >= rules.liquidationMinStock;
  if (filter === "full") return coverDays(listing) < rules.fullCoverDays;
  return true;
}

export function Anuncios() {
  const { state } = useOffice();
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    if (!state) return [];
    return state.listings
      .filter((listing) => matchFilter(listing, filter, state.rules))
      .filter((listing) => `${listing.title} ${listing.mlb} ${listing.sku}`.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => quoteAt(a).marginPct - quoteAt(b).marginPct);
  }, [state, filter, query]);

  if (!state) return <p className="loading">Carregando anúncios…</p>;

  const filters: { id: Filter; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "curta", label: "Abaixo da meta" },
    { id: "buybox", label: "Sem Buy Box" },
    { id: "parado", label: "Estoque parado" },
    { id: "full", label: "Full curto" },
  ];

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Anúncios</p>
          <h1>Margem de cada anúncio</h1>
          <p className="muted">
            Piso {pct(state.rules.minMarginPct)} · meta {pct(state.rules.targetMarginPct)}. A margem é o lucro sobre o preço que o comprador paga.
          </p>
        </div>
      </header>
      <div className="filters">
        {filters.map((item) => (
          <button key={item.id} type="button" className={filter === item.id ? "chip on" : "chip"} onClick={() => setFilter(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, SKU ou MLB" aria-label="Buscar anúncio" />
      <div className="table-wrap card" style={{ marginTop: "0.8rem" }}>
        <table className="data">
          <thead>
            <tr>
              <th>Anúncio</th>
              <th>Margem</th>
              <th>Comprador paga</th>
              <th>Estoque</th>
              <th>Full</th>
              <th>30 dias</th>
              <th>Buy Box</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((listing) => {
              const quote = quoteAt(listing);
              return (
                <tr key={listing.id}>
                  <td>
                    <Link href={`/anuncios/${listing.id}`}>{listing.title}</Link>
                    <div className="faint">
                      {listing.mlb} · {listing.promo?.name ?? "sem promoção"}
                    </div>
                  </td>
                  <td className={tone(quote.marginPct, state.rules)}>{pct(quote.marginPct)}</td>
                  <td>{brl(quote.buyerPrice)}</td>
                  <td>{listing.stock}</td>
                  <td>
                    {listing.fullStock}
                    <div className="faint">{coverLabel(coverDays(listing))}</div>
                  </td>
                  <td>{listing.sales30d}</td>
                  <td>{listing.buyBox ? "Sim" : listing.competitorName ?? "Não"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="empty">Nenhum anúncio neste recorte.</p> : null}
      </div>
    </section>
  );
}
