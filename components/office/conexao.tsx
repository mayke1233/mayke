"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOffice } from "@/components/office/office-context";
import { when } from "@/lib/format";
import { redirectHostBlocked } from "@/lib/ml/redirect";

interface Status {
  configured: boolean;
  pkce: boolean;
  redirectUri: string;
  clientIdHint: string | null;
  connected: boolean;
  nickname: string | null;
  lastError: string | null;
}

const ERRORS: Record<string, string> = {
  credenciais: "Salve o App ID e a Secret Key antes de conectar.",
  bloqueado: "O Mercado Livre bloqueia localhost e responde 403. Use um endereço HTTPS público.",
  negado: "A autorização foi cancelada no Mercado Livre.",
  codigo: "O Mercado Livre não devolveu o código de autorização.",
  token: "Não foi possível trocar o código pelo acesso.",
};

export function Conexao() {
  const office = useOffice();
  const params = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [pkce, setPkce] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/ml/app", { cache: "no-store" });
    const data = (await response.json()) as Status;
    setStatus(data);
    if (data.redirectUri) setRedirectUri(data.redirectUri);
    setPkce(data.pkce);
  }

  useEffect(() => {
    setRedirectUri((current) => current || `${window.location.origin}/api/ml/callback`);
    void load().catch(() => setMessage("Não consegui ler a configuração local."));
  }, []);

  const erro = params.get("erro");
  const known = erro ? ERRORS[erro] : null;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/ml/app", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, redirectUri, pkce }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não salvei o aplicativo.");
      setClientSecret("");
      setMessage("Aplicativo salvo nesta máquina. Agora autorize a conta.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function sync() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/ml/sync", { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "A sincronização falhou.");
      await office.refresh();
      setMessage("Conta atualizada.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao sincronizar.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Desconectar volta o escritório para a demonstração Casa Norte. A régua é mantida.")) return;
    setBusy(true);
    await fetch("/api/ml/disconnect", { method: "POST" });
    await office.refresh();
    await load();
    setBusy(false);
    setMessage("Conta desconectada.");
  }

  const connected = office.state?.connection.mode === "mercadolivre";
  const blocked = redirectHostBlocked(redirectUri);

  return (
    <section className="page conexao">
      <header className="page-head">
        <div>
          <p className="eyebrow">Mercado Livre</p>
          <h1>Conectar a sua conta</h1>
          <p className="muted">O acesso usa o OAuth do Mercado Livre. A senha da conta não passa pelo Mayke.</p>
        </div>
      </header>
      {known ? <p className="error-bar">{known}</p> : null}
      {status?.lastError ? <p className="error-bar">{status.lastError}</p> : null}
      {message ? <p className="banner">{message}</p> : null}

      <div className="split">
        <article className="card">
          <p className="eyebrow">Passo 1</p>
          <h2>Crie o aplicativo</h2>
          <ol className="guide">
            <li>Abra o DevCenter do Mercado Livre e crie um aplicativo.</li>
            <li>Em redirect URI, cole um HTTPS público que termine em /api/ml/callback. localhost recebe 403 da CloudFront.</li>
            <li>Copie o App ID e a Secret Key para o formulário ao lado.</li>
            <li>Entre com o usuário administrador da conta, não com um colaborador.</li>
          </ol>
          <p className="redirect-uri">{redirectUri || "…"}</p>
          <a className="btn secondary small" href="https://developers.mercadolivre.com.br/devcenter" target="_blank" rel="noreferrer">
            Abrir o DevCenter
          </a>
        </article>
        <article className="card">
          <p className="eyebrow">Passo 2</p>
          <h2>Salvar as credenciais</h2>
          <form className="stack" onSubmit={(event) => void save(event)}>
            <label className="field">
              <span>App ID</span>
              <input value={clientId} onChange={(event) => setClientId(event.target.value)} autoComplete="off" required />
            </label>
            <label className="field">
              <span>Secret Key</span>
              <input
                type="password"
                value={clientSecret}
                onChange={(event) => setClientSecret(event.target.value)}
                autoComplete="off"
                required
              />
            </label>
            <label className="field">
              <span>Redirect URI</span>
              <input value={redirectUri} onChange={(event) => setRedirectUri(event.target.value)} required />
            </label>
            <label className="check">
              <input type="checkbox" checked={pkce} onChange={(event) => setPkce(event.target.checked)} />
              O aplicativo exige PKCE
            </label>
            <button className="btn" type="submit" disabled={busy}>
              Salvar aplicativo
            </button>
            {status?.configured ? <p className="faint">App ID já salvo: {status.clientIdHint}</p> : null}
          </form>
        </article>
      </div>

      <article className="card" style={{ marginTop: "0.8rem" }}>
        <p className="eyebrow">Passo 3</p>
        <h2>{connected ? `Conectado como ${office.state?.account.nickname}` : "Autorizar e ler a conta"}</h2>
        <p className="muted">
          Depois da autorização, o squad lê anúncios, tarifa e perguntas abertas. Cadastre o custo de cada item. Sem custo, nenhum preço é alterado. O que for verde em preço ou resposta é publicado na conta.
        </p>
        {connected && office.state?.connection.syncedAt ? (
          <p className="faint">Última leitura: {when(office.state.connection.syncedAt)}</p>
        ) : null}
        {connected && office.state?.connection.notice ? <p style={{ marginTop: "0.6rem" }}>{office.state.connection.notice}</p> : null}
        {blocked ? (
          <p className="error-bar" style={{ marginTop: "0.8rem" }}>
            A página 403 acontece porque a Redirect URI usa localhost. O Mercado Livre bloqueia esse host. Abra um túnel HTTPS até esta porta e cadastre a URL pública, terminada em /api/ml/callback, no DevCenter e neste formulário.
          </p>
        ) : null}
        <div className="row" style={{ marginTop: "0.9rem" }}>
          {blocked ? (
            <button className="btn secondary" type="button" disabled>
              {connected ? "Reautorizar" : "Conectar Mercado Livre"}
            </button>
          ) : (
            <a className={`btn ${status?.configured ? "" : "secondary"}`} href="/api/ml/start">
              {connected ? "Reautorizar" : "Conectar Mercado Livre"}
            </a>
          )}
          {connected ? (
            <button className="btn secondary" type="button" disabled={busy} onClick={() => void sync()}>
              Sincronizar agora
            </button>
          ) : null}
          {connected ? (
            <button className="btn danger" type="button" disabled={busy} onClick={() => void disconnect()}>
              Desconectar
            </button>
          ) : null}
        </div>
      </article>
    </section>
  );
}
