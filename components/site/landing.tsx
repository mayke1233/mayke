import Link from "next/link";
import { Mark } from "@/components/mark";
import { Semaphore } from "@/components/semaphore";
import { AGENTS, agentName } from "@/lib/agents";
import { pct } from "@/lib/format";
import { previewOffice } from "@/lib/preview";
import { DEFAULT_RULES } from "@/lib/rules";

const MARQUEE = [
  "Seis agentes, uma pauta",
  "Margem travada por você",
  "Verde executa",
  "Amarelo espera",
  "Vermelho não mexe",
  "Reunião todo dia",
  "Ata no painel",
  "Estoque, anúncio e atendimento na mesma mesa",
];

export function Landing() {
  const preview = previewOffice();
  const highlights = [
    preview.actions.find((action) => action.listingId === "panelas"),
    preview.actions.find((action) => action.listingId === "garrafa"),
    preview.actions.find((action) => action.listingId === "cadeira" && action.autonomy === "vermelho"),
    preview.actions.find((action) => action.rule === "atendimento" && action.autonomy === "amarelo"),
  ].filter((action) => action != null);

  return (
    <div className="site">
      <header className="top">
        <Link href="/" className="brand">
          <Mark />
          <span>Mayke</span>
        </Link>
        <nav className="nav-links" aria-label="Seções">
          <a href="#squad">Squad</a>
          <a href="#regua">Régua</a>
          <a href="#pauta">Pauta</a>
          <Link href="/painel">Painel</Link>
        </nav>
        <Link className="btn" href="/painel">
          Abrir o escritório
        </Link>
      </header>

      <main id="conteudo">
        <section className="hero">
          <div>
            <p className="eyebrow">Escritório virtual de agentes</p>
            <h1>Sua conta no Mercado Livre ganha um squad.</h1>
            <p className="lead">
              Seis agentes fecham uma pauta por dia: preço, anúncio, imagem, ads, estoque e atendimento. O que cabe na
              régua eles executam. O que passa do limite chega na sua fila, com o antes e o depois.
            </p>
            <div className="cta-row">
              <Link className="btn" href="/painel">
                Entrar na Casa Norte
              </Link>
              <a className="btn secondary" href="#regua">
                Ver a régua
              </a>
            </div>
            <p className="fine">
              A conta Casa Norte é uma demonstração. O motor aplica as regras de verdade, neste escritório. Nada é
              enviado ao Mercado Livre.
            </p>
          </div>
          <aside className="ata" aria-label="Prévia da reunião">
            <div className="ata-head">
              <div>
                <p className="eyebrow">Ata da Casa Norte</p>
                <strong>{preview.meeting.title}</strong>
              </div>
            </div>
            <p className="summary">{preview.meeting.summary}</p>
            <div className="log">
              {highlights.map((action) => (
                <Link key={action.id} href="/painel" className="log-row">
                  <span className={`dot ${action.autonomy}`} />
                  <span>
                    <b>
                      {agentName(action.agent)} · {action.title}
                    </b>
                    <small>
                      {action.beforeMargin != null && action.afterMargin != null
                        ? `${pct(action.beforeMargin)} → ${pct(action.afterMargin)} · `
                        : ""}
                      {action.autonomy === "verde"
                        ? "executa"
                        : action.autonomy === "amarelo"
                          ? "sobe para você"
                          : "não mexe"}
                    </small>
                  </span>
                </Link>
              ))}
            </div>
          </aside>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...MARQUEE, ...MARQUEE].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>

        <section className="section">
          <div className="section-head">
            <p className="eyebrow">O operacional</p>
            <h2>A conta cresce. A rotina continua na sua mão.</h2>
          </div>
          <div className="problem-grid">
            <article className="paper">
              <p className="index">01</p>
              <h3>Um painel para cada buraco</h3>
              <p>Preço num lugar, pergunta em outro, ads num terceiro. Ninguém cruza margem com estoque antes de agir.</p>
            </article>
            <article className="paper">
              <p className="index">02</p>
              <h3>O mesmo checklist todo dia</h3>
              <p>Promoção, ruptura, ACOS, imagem fraca, pergunta repetida. O time passa o expediente conferindo o que já conferiu ontem.</p>
            </article>
            <article className="paper">
              <p className="index">03</p>
              <h3>A decisão mora em você</h3>
              <p>Quem deveria pensar o sortimento é quem abre a central de promoções item por item. O operacional não sobe de cargo.</p>
            </article>
          </div>
        </section>

        <section className="section" id="squad">
          <div className="section-head">
            <p className="eyebrow">O squad</p>
            <h2>Cada um fala da sua área. O gestor fecha a ata.</h2>
          </div>
          <div className="squad-grid">
            {AGENTS.map((agent) => (
              <article key={agent.id} className="agent-tile">
                <p className="eyebrow">{agent.role}</p>
                <h3>{agent.name}</h3>
                <p>{agent.mandate}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="regua">
          <div className="section-head">
            <p className="eyebrow">Autonomia</p>
            <h2>A régua diz até onde o squad vai sozinho.</h2>
            <p className="muted" style={{ marginTop: "0.7rem" }}>
              Piso de {pct(DEFAULT_RULES.minMarginPct)}, queda livre de até {DEFAULT_RULES.yellowDropPp} pontos, liquidação
              até {pct(DEFAULT_RULES.liquidationFloorPct)}. Você muda esses números no painel.
            </p>
          </div>
          <Semaphore
            min={DEFAULT_RULES.minMarginPct}
            drop={DEFAULT_RULES.yellowDropPp}
            floor={DEFAULT_RULES.liquidationFloorPct}
          />
        </section>

        <section className="section" id="pauta">
          <div className="section-head">
            <p className="eyebrow">Como a pauta anda</p>
            <h2>Três passos, e o resto não entra na sua agenda.</h2>
          </div>
          <div className="steps">
            <article className="step">
              <p className="index">01</p>
              <h3>Você trava a régua</h3>
              <p>Piso, meta, ACOS, cobertura do Full e o que pode ser liquidado. Sem isso, ninguém executa.</p>
            </article>
            <article className="step">
              <p className="index">02</p>
              <h3>O squad se reúne</h3>
              <p>Cada agente traz a área dele. A ação verde já sai registrada. A amarela espera. A vermelha morre na ata.</p>
            </article>
            <article className="step">
              <p className="index">03</p>
              <h3>Você só vê o que passou</h3>
              <p>A fila mostra o antes e o depois. Aprovar aplica na conta da demonstração. Recusar tira o item da pauta.</p>
            </article>
          </div>
        </section>

        <section className="closing">
          <div>
            <p className="eyebrow" style={{ color: "#f0c36a" }}>
              Casa Norte Utilidades
            </p>
            <h2>Abre o escritório e roda a reunião de hoje.</h2>
          </div>
          <div>
            <p>Treze anúncios, quatro campanhas e a fila real do motor. Aprovar, recusar e apertar a régua muda o resultado.</p>
            <div className="cta-row">
              <Link className="btn" href="/painel">
                Abrir o painel
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer">
        <span>Mayke · escritório virtual de agentes</span>
        <span>Demonstração local. Não é o Mercado Livre e não fala com a conta real.</span>
      </footer>
    </div>
  );
}
