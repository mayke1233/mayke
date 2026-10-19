import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import {
  agents,
  doneSeed,
  meeting,
  pendingSeed,
  type ActionItem,
  type ActionStatus,
  type MeetingLine,
  type PendingItem,
} from "../content";

type Filter = "all" | ActionStatus;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "auto", label: "Automáticas" },
  { id: "approved", label: "Aprovadas" },
  { id: "rejected", label: "Recusadas" },
];

export function Office() {
  const [pending, setPending] = useState<PendingItem[]>(pendingSeed);
  const [log, setLog] = useState<ActionItem[]>(doneSeed);
  const [lines, setLines] = useState<MeetingLine[]>(meeting);
  const [floor, setFloor] = useState(10);
  const [filter, setFilter] = useState<Filter>("all");
  const [notice, setNotice] = useState("");

  const visibleLog = log.filter((item) => filter === "all" || item.status === filter);
  const belowFloor = useMemo(
    () => log.filter((item) => item.status === "auto" && item.marginAfter !== null && item.marginAfter < floor),
    [floor, log],
  );

  function decide(id: string, status: "approved" | "rejected") {
    const item = pending.find((entry) => entry.id === id);
    if (!item) return;

    setPending((current) => current.filter((entry) => entry.id !== id));
    setLog((current) => [
      {
        ...item,
        status,
        time: "agora",
        period: "sua decisão",
      },
      ...current,
    ]);
    setLines((current) => [
      ...current,
      {
        agent: "Condutor",
        time: "agora",
        text:
          status === "approved"
            ? `Aprovado: ${item.title}. A ação entra no registro e segue para execução.`
            : `Recusado: ${item.title}. Nenhuma alteração será feita na conta.`,
      },
    ]);
    setFilter("all");
    setNotice(
      status === "approved"
        ? "Decisão aprovada. Ela entrou no topo do registro."
        : "Decisão recusada. O squad não executa essa ação.",
    );
  }

  return (
    <div className="office">
      <TopBar mode="office" />
      <main>
        <header className="office-intro">
          <div>
            <p className="eyebrow">Conta fictícia · Casa Lume</p>
            <h1>Escritório de terça, 19 de outubro</h1>
            <p>A reunião já fechou. Três decisões esperam você. O restante do turno já foi executado.</p>
          </div>
          <dl className="kpi-strip">
            <div>
              <dt>Faturamento de ontem</dt>
              <dd>R$ 18.420</dd>
            </div>
            <div>
              <dt>Margem média</dt>
              <dd>17,4%</dd>
            </div>
            <div>
              <dt>Ações no registro</dt>
              <dd>{log.length}</dd>
            </div>
            <div>
              <dt>Na sua alçada</dt>
              <dd>{pending.length}</dd>
            </div>
          </dl>
        </header>

        <section className="office-grid">
          <aside className="panel">
            <h2>Squad em turno</h2>
            <ul className="squad-list">
              {agents.map((agent) => {
                const waiting = pending.filter((item) => item.agent === agent.name).length;
                return (
                  <li key={agent.id}>
                    <span className="agent-dot" style={{ background: agent.tone }} />
                    <span>
                      <strong>{agent.name}</strong>
                      <small>{agent.role}</small>
                    </span>
                    <em>{waiting ? `${waiting} na fila` : "em dia"}</em>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="panel transcript" aria-labelledby="pauta-titulo">
            <header className="panel-head">
              <h2 id="pauta-titulo">Pauta do dia</h2>
              <span>{lines.length} falas</span>
            </header>
            <ol>
              {lines.map((line, index) => (
                <li key={`${line.time}-${line.agent}-${index}`}>
                  <span>
                    {line.time} · {line.agent}
                  </span>
                  <p>{line.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel queue" aria-labelledby="fila-titulo">
            <header className="panel-head">
              <h2 id="fila-titulo">Fila de alçada</h2>
              <span>{pending.length} abertas</span>
            </header>
            <label className="floor">
              <span>
                Piso de margem autônoma <strong>{floor}%</strong>
              </span>
              <input
                type="range"
                min={8}
                max={18}
                step={1}
                value={floor}
                aria-valuemin={8}
                aria-valuemax={18}
                aria-valuenow={floor}
                aria-label="Piso de margem autônoma"
                onChange={(event) => setFloor(Number(event.target.value))}
              />
              <small>
                {belowFloor.length
                  ? `${belowFloor.length} ação automática já executada ficaria abaixo desse piso.`
                  : "Nenhuma ação automática do turno fica abaixo desse piso."}
              </small>
            </label>
            {notice ? (
              <p className="notice" role="status">
                {notice}
              </p>
            ) : null}
            {pending.length === 0 ? (
              <p className="empty-queue">Fila limpa. O squad segue apenas dentro da alçada.</p>
            ) : (
              <ul>
                {pending.map((item) => (
                  <li key={item.id}>
                    <p className="queue-agent">{item.agent}</p>
                    <h3>{item.title}</h3>
                    <p>{item.reason}</p>
                    <p className="log-metrics">
                      <span>{item.before}</span>
                      <span aria-hidden="true">→</span>
                      <span>{item.after}</span>
                    </p>
                    <div className="queue-actions">
                      <button type="button" className="btn btn-primary btn-small" onClick={() => decide(item.id, "approved")}>
                        Aprovar
                      </button>
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => decide(item.id, "rejected")}>
                        Recusar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>

        <section className="panel register" aria-labelledby="registro-titulo">
          <header className="panel-head">
            <h2 id="registro-titulo">Registro do turno</h2>
            <div className="filters" role="group" aria-label="Filtrar registro">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={filter === item.id}
                  className={filter === item.id ? "is-on" : undefined}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </header>
          {visibleLog.length === 0 ? (
            <p className="empty-queue">Nenhuma ação com esse filtro.</p>
          ) : (
            <ul className="register-list">
              {visibleLog.map((item) => {
                const warned =
                  item.status === "auto" && item.marginAfter !== null && item.marginAfter < floor;
                return (
                  <li key={`${item.id}-${item.time}`} className={warned ? "is-warned" : undefined}>
                    <div>
                      <span className={`badge badge-${item.status}`}>
                        {item.status === "auto" ? "Auto" : item.status === "approved" ? "Aprovada" : "Recusada"}
                      </span>
                      <time>
                        {item.time} · {item.period}
                      </time>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.reason}</p>
                    <p className="log-metrics">
                      <span>{item.before}</span>
                      <span aria-hidden="true">→</span>
                      <span>{item.after}</span>
                      <strong>{item.delta}</strong>
                    </p>
                    <footer>
                      {item.agent} · {item.rule}
                      {warned ? " · abaixo do piso atual" : ""}
                    </footer>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="office-foot">
          <Link to="/#demonstracao">Levar essa leitura para a minha conta</Link>
        </p>
      </main>
    </div>
  );
}
