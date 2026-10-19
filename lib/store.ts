import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSeed } from "./seed";
import type { AppState } from "./types";

const file = path.join(process.cwd(), "data", "state.json");

let chain: Promise<unknown> = Promise.resolve();

function isState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const state = value as AppState;
  return state.version === 1 && Array.isArray(state.listings) && Array.isArray(state.actions) && Boolean(state.rules);
}

async function write(state: AppState): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(state, null, 2));
}

async function read(): Promise<AppState> {
  try {
    const raw = await readFile(file, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (isState(parsed)) {
      if (!parsed.connection) parsed.connection = { mode: "demonstracao", syncedAt: null, notice: null };
      return parsed;
    }
  } catch {
    // arquivo ausente ou inválido: a demonstração recomeça do seed
  }
  const seed = createSeed();
  await write(seed);
  return seed;
}

export function updateState(change: (state: AppState) => AppState | Promise<AppState>): Promise<AppState> {
  const run = chain.then(async () => {
    const current = await read();
    const next = await change(current);
    await write(next);
    return next;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function readState(): Promise<AppState> {
  return updateState((state) => state);
}
