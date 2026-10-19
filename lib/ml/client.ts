import { createHash, randomBytes } from "node:crypto";
import type { MlApp } from "./config";
import { readApp } from "./config";
import { readSession, takeOauth, writeOauth, writeSession, type MlSession } from "./session";

const API = "https://api.mercadolibre.com";
const AUTH = "https://auth.mercadolivre.com.br/authorization";

export function codeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function codeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function beginAuthorization(app: MlApp): Promise<string> {
  const state = randomBytes(16).toString("base64url");
  const verifier = app.pkce ? codeVerifier() : undefined;
  await writeOauth({ state, verifier, createdAt: Date.now() });
  const url = new URL(AUTH);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", app.clientId);
  url.searchParams.set("redirect_uri", app.redirectUri);
  url.searchParams.set("state", state);
  if (verifier) {
    url.searchParams.set("code_challenge", codeChallenge(verifier));
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
}

async function tokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as Partial<TokenResponse> & {
    error_description?: string;
    message?: string;
  };
  if (!response.ok || !payload.access_token || !payload.refresh_token) {
    throw new Error(payload.error_description || payload.message || "O Mercado Livre não entregou o acesso.");
  }
  return payload as TokenResponse;
}

async function sessionFromToken(token: TokenResponse, nickname = ""): Promise<MlSession> {
  const session: MlSession = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + token.expires_in * 1000,
    userId: token.user_id,
    nickname,
  };
  await writeSession(session);
  return session;
}

export async function exchangeCode(code: string, state: string): Promise<MlSession> {
  const app = await readApp();
  if (!app) throw new Error("Cadastre o aplicativo do Mercado Livre antes de conectar.");
  const pending = await takeOauth(state);
  if (!pending) throw new Error("A autorização expirou. Comece de novo em Conectar.");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: app.clientId,
    client_secret: app.clientSecret,
    code,
    redirect_uri: app.redirectUri,
  });
  if (pending.verifier) body.set("code_verifier", pending.verifier);
  return sessionFromToken(await tokenRequest(body));
}

async function refresh(session: MlSession, app: MlApp): Promise<MlSession> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: app.clientId,
    client_secret: app.clientSecret,
    refresh_token: session.refreshToken,
  });
  const token = await tokenRequest(body);
  return sessionFromToken(token, session.nickname);
}

export async function authorizedSession(): Promise<MlSession> {
  const session = await readSession();
  if (!session) throw new Error("Nenhuma conta do Mercado Livre está conectada.");
  if (session.expiresAt - 60_000 > Date.now()) return session;
  const app = await readApp();
  if (!app) throw new Error("O aplicativo do Mercado Livre não está mais configurado.");
  return refresh(session, app);
}

export async function mlFetch(path: string, init?: RequestInit): Promise<Response> {
  const session = await authorizedSession();
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${session.accessToken}`);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  return fetch(path.startsWith("http") ? path : `${API}${path}`, { ...init, headers });
}

export async function mlJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await mlFetch(path, init);
  const payload = (await response.json().catch(() => ({}))) as T & { message?: string; error?: string };
  if (!response.ok) {
    const message = payload.message || payload.error || `Mercado Livre respondeu ${response.status}.`;
    throw new Error(message);
  }
  return payload;
}

export async function rememberNickname(nickname: string): Promise<void> {
  const session = await readSession();
  if (!session) return;
  await writeSession({ ...session, nickname });
}
