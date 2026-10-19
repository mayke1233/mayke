"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "@/components/mark";
import { useOffice } from "./office-context";

const LINKS = [
  { href: "/painel", label: "Painel" },
  { href: "/reuniao", label: "Reunião" },
  { href: "/agentes", label: "Agentes" },
  { href: "/anuncios", label: "Anúncios" },
  { href: "/aprovacoes", label: "Aprovações", count: "pending" },
  { href: "/acoes", label: "Ações" },
  { href: "/ads", label: "Ads" },
  { href: "/sac", label: "SAC", count: "questions" },
  { href: "/regras", label: "Regras" },
  { href: "/relatorio", label: "Relatório" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const office = useOffice();
  const pending = office.state?.actions.filter((action) => action.status === "pendente").length ?? 0;
  const questions = office.state?.questions.filter((question) => question.status === "aberta").length ?? 0;

  return (
    <div className="shell">
      <aside className="side">
        <Link href="/" className="brand">
          <Mark size={26} />
          <span>Mayke</span>
        </Link>
        <nav aria-label="Escritório">
          {LINKS.map((link) => {
            const active = path === link.href || (link.href !== "/painel" && path.startsWith(link.href));
            const count = link.count === "pending" ? pending : link.count === "questions" ? questions : 0;
            return (
              <Link key={link.href} href={link.href} className={active ? "nav active" : "nav"}>
                {link.label}
                {count > 0 ? <span className="count">{count}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="side-foot">
          <strong>{office.state?.account.name ?? "Casa Norte"}</strong>
          <p>Demonstração local. Nada sai para o Mercado Livre.</p>
          <Link href="/">Voltar ao site</Link>
        </div>
      </aside>
      <div className="main">
        <div className="office-top">
          <p className="muted">
            {office.state
              ? `${office.state.account.nickname} · ${office.state.account.medal} · ${office.state.account.city}`
              : "Abrindo a conta…"}
          </p>
          <button className="btn" type="button" onClick={() => void office.runSquad()} disabled={office.busy || !office.state}>
            {office.busy ? "Squad em reunião…" : "Rodar squad"}
          </button>
        </div>
        {office.error ? <p className="error-bar">{office.error}</p> : null}
        <div id="conteudo">{children}</div>
      </div>
      {office.ceremony ? (
        <div className="ceremony" role="dialog" aria-modal="true" aria-labelledby="ceremony-title">
          <div className="ceremony-card">
            <p className="eyebrow">Reunião do squad</p>
            <h2 id="ceremony-title" className="ata-title">
              {office.ceremony.done ? "Ata fechada" : "Eles estão em pauta"}
            </h2>
            {office.ceremony.done ? (
              <p className="muted" style={{ marginTop: "0.5rem" }}>
                {office.ceremony.created} {office.ceremony.created === 1 ? "ação nova" : "ações novas"},{" "}
                {office.ceremony.pending} na fila e {office.ceremony.blocked}{" "}
                {office.ceremony.blocked === 1 ? "bloqueio" : "bloqueios"}.
              </p>
            ) : (
              <div className="beats">
                {office.beats.map((beat, index) => (
                  <p key={`${beat.agent}-${index}`} className={index === office.ceremony?.step ? "beat on" : "beat"}>
                    <strong>{beat.agent}.</strong> {beat.text}
                  </p>
                ))}
              </div>
            )}
            {office.ceremony.done ? (
              <div className="cta-row">
                <Link className="btn" href="/reuniao" onClick={office.closeCeremony}>
                  Ver a ata
                </Link>
                <Link className="btn secondary" href="/aprovacoes" onClick={office.closeCeremony}>
                  Abrir a fila
                </Link>
                <button className="btn secondary" type="button" onClick={office.closeCeremony}>
                  Fechar
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
