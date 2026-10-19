import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface MlApp {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  pkce: boolean;
}

const file = path.join(process.cwd(), "data", "ml-app.json");

function fromEnv(): MlApp | null {
  const clientId = process.env.ML_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.ML_CLIENT_SECRET?.trim() ?? "";
  const redirectUri = process.env.ML_REDIRECT_URI?.trim() ?? "";
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri, pkce: process.env.ML_PKCE === "true" };
}

export function isRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.pathname === "/api/ml/callback";
  } catch {
    return false;
  }
}

export async function readApp(): Promise<MlApp | null> {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as Partial<MlApp>;
    if (parsed.clientId && parsed.clientSecret && parsed.redirectUri && isRedirectUri(parsed.redirectUri)) {
      return {
        clientId: parsed.clientId.trim(),
        clientSecret: parsed.clientSecret.trim(),
        redirectUri: parsed.redirectUri.trim(),
        pkce: Boolean(parsed.pkce),
      };
    }
  } catch {
    // ainda não há aplicativo salvo na máquina
  }
  return fromEnv();
}

export async function saveApp(app: MlApp): Promise<void> {
  if (!isRedirectUri(app.redirectUri)) {
    throw new Error("A URL de redirecionamento precisa terminar em /api/ml/callback.");
  }
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(
    file,
    JSON.stringify(
      {
        clientId: app.clientId.trim(),
        clientSecret: app.clientSecret.trim(),
        redirectUri: app.redirectUri.trim(),
        pkce: app.pkce,
      },
      null,
      2,
    ),
  );
}

export function maskClientId(clientId: string): string {
  if (clientId.length <= 8) return "configurado";
  return `${clientId.slice(0, 4)}…${clientId.slice(-4)}`;
}
