import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section">
      <p className="eyebrow">404</p>
      <h1 className="ata-title" style={{ fontSize: "3rem" }}>
        Essa página não está no escritório.
      </h1>
      <div className="cta-row">
        <Link className="btn" href="/">
          Ir para o início
        </Link>
        <Link className="btn secondary" href="/painel">
          Abrir o painel
        </Link>
      </div>
    </main>
  );
}
