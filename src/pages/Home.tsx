import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { TopBar } from "../components/TopBar";
import {
  agents,
  landingLog,
  marquee,
  meeting,
  objectives,
  pains,
  revenueBands,
  signals,
} from "../content";
import { usePrefersReducedMotion } from "../usePrefersReducedMotion";

const LEAD_KEY = "quorum.leads";

export function Home() {
  const reduced = usePrefersReducedMotion();
  const [line, setLine] = useState(reduced ? meeting.length - 1 : 0);
  const [paused, setPaused] = useState(false);
  const [signal, setSignal] = useState(0);
  const [signalHeld, setSignalHeld] = useState(false);

  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => {
      setLine((current) => (current + 1) % meeting.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, [paused, reduced]);

  useEffect(() => {
    if (reduced || signalHeld) return;
    const id = window.setInterval(() => {
      setSignal((current) => (current + 1) % signals.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [reduced, signalHeld]);

  const visible = meeting.slice(0, line + 1).slice(-4);
  const activeSignal = signals[signal];

  return (
    <div className="site">
      <TopBar />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="kicker">
              <span className="pulse" aria-hidden="true" />
              Turno aberto para contas novas
            </p>
            <h1>Seis agentes entram em reunião. A conta anda. Você só vê o que saiu da alçada.</h1>
            <p className="lede">
              Quórum é um escritório virtual para quem vende em marketplace. Cada agente tem uma
              função. Juntos eles ajustam preço, anúncio, mídia, imagem e atendimento dentro das
              regras da loja.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/escritorio">
                Abrir o escritório
              </Link>
              <a className="btn btn-ghost" href="#demonstracao">
                Pedir demonstração
              </a>
            </div>
            <dl className="stat-row">
              <div>
                <dt>Agentes</dt>
                <dd>6</dd>
              </div>
              <div>
                <dt>Relatório</dt>
                <dd>1 / dia</dd>
              </div>
              <div>
                <dt>Níveis de alçada</dt>
                <dd>3</dd>
              </div>
            </dl>
          </div>

          <article className="room" aria-labelledby="reuniao-titulo">
            <header className="room-head">
              <p id="reuniao-titulo">
                <span className="pulse" aria-hidden="true" />
                Reunião do squad · Casa Lume
              </p>
              <button type="button" onClick={() => setPaused((value) => !value)}>
                {paused ? "Retomar" : "Pausar"}
              </button>
            </header>
            <ol className="room-lines">
              {visible.map((item, index) => (
                <li
                  key={`${item.time}-${item.agent}`}
                  className={index === visible.length - 1 ? "is-current" : undefined}
                >
                  <span>
                    {item.time}
                    <strong>{item.agent}</strong>
                  </span>
                  <p>{item.text}</p>
                </li>
              ))}
            </ol>
            <footer>Conta fictícia de demonstração · pauta fechada às 06:47</footer>
          </article>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className={reduced ? "marquee-track is-still" : "marquee-track"}>
            {[...marquee, ...marquee].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>

        <section className="section" id="como-funciona">
          <div className="section-head">
            <p className="eyebrow">A pauta</p>
            <h2>Eles se reúnem sem você. Discordam quando os dados pedem. Fecham uma decisão.</h2>
          </div>
          <p className="section-lead">
            A reunião é diária e tem roteiro fixo: seis reportes, um fechamento. O Condutor consolida
            o que já foi executado e separa o que precisa de aprovação. Nada disso entra na sua
            agenda.
          </p>
          <div className="objectives">
            {objectives.map((item) => (
              <article key={item.index}>
                <span>{item.index}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section section-tight" id="squad">
          <div className="section-head">
            <p className="eyebrow">O squad</p>
            <h2>Uma função cada. Um objetivo só: a conta saudável.</h2>
          </div>
          <div className="agent-grid">
            {agents.map((agent, index) => (
              <article key={agent.id} className="agent-card">
                <header>
                  <span className="agent-dot" style={{ background: agent.tone }} />
                  <span className="agent-index">0{index + 1}</span>
                </header>
                <h3>{agent.name}</h3>
                <p className="agent-role">{agent.role}</p>
                <p>{agent.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <p className="eyebrow">O que trava a conta</p>
            <h2>A operação funciona. Ela ainda depende de alguém repetir o mesmo gesto todo dia.</h2>
          </div>
          <div className="pain-grid">
            {pains.map((pain) => (
              <article key={pain.index}>
                <span>{pain.index}</span>
                <h3>{pain.title}</h3>
                <p>{pain.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="band" id="alcada">
          <div className="band-inner">
            <div>
              <p className="eyebrow">Alçada</p>
              <h2>A autonomia tem limite visível. Verde age. Amarelo espera. Vermelho não mexe.</h2>
              <p className="section-lead light">
                Você define a faixa uma vez. O squad usa essa faixa em preço, campanha, verba e
                pós-venda. O semáforo não é um aviso genérico: ele decide se a ação sai ou se para
                na fila.
              </p>
            </div>
            <div className="semaphore">
              <div className="lamps" role="tablist" aria-label="Níveis de alçada">
                {signals.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={index === signal}
                    className={index === signal ? `lamp is-on lamp-${item.id}` : `lamp lamp-${item.id}`}
                    onClick={() => {
                      setSignal(index);
                      setSignalHeld(true);
                    }}
                  >
                    <i />
                    {item.label}
                  </button>
                ))}
              </div>
              <article className={`signal-card signal-${activeSignal.id}`}>
                <p>{activeSignal.name}</p>
                <h3>{activeSignal.label}</h3>
                <p>{activeSignal.text}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="registro">
          <div className="section-head">
            <p className="eyebrow">Fora do expediente</p>
            <h2>O turno não acaba quando o escritório fecha. O registro fica para o dia seguinte.</h2>
          </div>
          <p className="section-lead">
            Exemplos de uma conta fictícia. Cada linha diz o que mudou, o valor anterior, o valor
            novo e a regra que autorizou a ação.
          </p>
          <div className="log-list">
            {landingLog.map((item) => (
              <article key={item.id} className="log-item">
                <header>
                  <span className="badge">Auto · executado</span>
                  <time>
                    {item.time} · {item.period}
                  </time>
                </header>
                <h3>{item.title}</h3>
                <p>{item.reason}</p>
                <p className="log-metrics">
                  <span>{item.before}</span>
                  <span aria-hidden="true">→</span>
                  <span>{item.after}</span>
                  <strong>{item.delta}</strong>
                </p>
                <footer>
                  {item.agent} · regra {item.rule}
                </footer>
              </article>
            ))}
          </div>
          <p className="section-cta">
            <Link className="btn btn-primary" to="/escritorio">
              Ver a fila e o relatório no escritório
            </Link>
          </p>
        </section>

        <LeadForm />
      </main>
      <Footer />
    </div>
  );
}

function readLeads(): unknown[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEAD_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function LeadForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lead = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      store: String(data.get("store") ?? "").trim(),
      band: String(data.get("band") ?? ""),
    };

    if (!lead.name || !lead.store || !lead.band) {
      setError("Preencha nome, loja e faixa de faturamento.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(lead.email)) {
      setError("Informe um e-mail válido.");
      return;
    }

    const current = readLeads();
    localStorage.setItem(
      LEAD_KEY,
      JSON.stringify([...current, { ...lead, createdAt: new Date().toISOString() }]),
    );
    setError("");
    setSent(true);
  }

  return (
    <section className="section form-section" id="demonstracao">
      <div>
        <p className="eyebrow">Demonstração</p>
        <h2>Sua conta já vende. Dá para ver o que um squad operaria no lugar da rotina.</h2>
        <p className="section-lead">
          A conversa dura cerca de 30 minutos. Você sai com um mapa das rotinas que cabem em
          autonomia, das que ficam na sua alçada e do que continua com o time.
        </p>
      </div>

      {sent ? (
        <div className="form-success" role="status">
          <p className="eyebrow">Pedido registrado</p>
          <h3>Recebemos os dados desta demonstração.</h3>
          <p>
            Eles ficaram apenas neste navegador. Enquanto isso, o escritório da Casa Lume já está
            aberto para você aprovar ou recusar a fila do dia.
          </p>
          <Link className="btn btn-primary" to="/escritorio">
            Entrar no escritório
          </Link>
        </div>
      ) : (
        <form className="lead-form" onSubmit={onSubmit} noValidate>
          <label>
            Nome
            <input name="name" autoComplete="name" placeholder="Seu nome" />
          </label>
          <label>
            E-mail
            <input name="email" type="email" autoComplete="email" placeholder="voce@loja.com" />
          </label>
          <label>
            Loja
            <input name="store" autoComplete="organization" placeholder="Nome da loja" />
          </label>
          <label>
            Faixa de faturamento
            <select name="band" defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {revenueBands.map((band) => (
                <option key={band} value={band}>
                  {band}
                </option>
              ))}
            </select>
          </label>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="btn btn-primary" type="submit">
            Quero a demonstração
          </button>
          <p className="form-note">Os dados deste formulário não saem do seu navegador.</p>
        </form>
      )}
    </section>
  );
}
