import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export interface MlSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: number;
  nickname: string;
}

export interface OauthPending {
  state: string;
  verifier?: string;
  createdAt: number;
}

const sessionFile = path.join(process.cwd(), "data", "ml-session.json");
const oauthFile = path.join(process.cwd(), "data", "ml-oauth.json");
const errorFile = path.join(process.cwd(), "data", "ml-last-error.json");

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2));
}

export async function readSession(): Promise<MlSession | null> {
  try {
    const parsed = JSON.parse(await readFile(sessionFile, "utf8")) as MlSession;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeSession(session: MlSession): Promise<void> {
  await writeJson(sessionFile, session);
}

export async function clearSession(): Promise<void> {
  await rm(sessionFile, { force: true });
}

export async function writeOauth(pending: OauthPending): Promise<void> {
  await writeJson(oauthFile, pending);
}

export async function takeOauth(state: string): Promise<OauthPending | null> {
  try {
    const parsed = JSON.parse(await readFile(oauthFile, "utf8")) as OauthPending;
    await rm(oauthFile, { force: true });
    if (parsed.state !== state) return null;
    if (Date.now() - parsed.createdAt > 10 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeLastError(message: string | null): Promise<void> {
  if (!message) {
    await rm(errorFile, { force: true });
    return;
  }
  await writeJson(errorFile, { message: message.slice(0, 300) });
}

export async function readLastError(): Promise<string | null> {
  try {
    const parsed = JSON.parse(await readFile(errorFile, "utf8")) as { message?: string };
    return parsed.message ?? null;
  } catch {
    return null;
  }
}
