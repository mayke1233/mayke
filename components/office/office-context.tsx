"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AppState, Rules } from "@/lib/types";

const BEATS = [
  { agent: "Gestor", text: "Abre a pauta e cobra a margem do dia." },
  { agent: "Analista", text: "Confere Buy Box, ruptura e cobertura do Full." },
  { agent: "Anúncios", text: "Varre promoção e estoque parado." },
  { agent: "Criativo", text: "Mede visita e conversão." },
  { agent: "ADS", text: "Redistribui verba conforme ACOS e estoque." },
  { agent: "SAC", text: "Responde o padrão e separa reclamação." },
  { agent: "Gestor", text: "Fecha a ata." },
];

export interface Ceremony {
  step: number;
  done: boolean;
  created: number;
  pending: number;
  blocked: number;
}

interface OfficeValue {
  state: AppState | null;
  busy: boolean;
  error: string | null;
  ceremony: Ceremony | null;
  beats: typeof BEATS;
  refresh: () => Promise<void>;
  runSquad: () => Promise<void>;
  closeCeremony: () => void;
  decide: (id: string, decision: "aprovar" | "recusar") => Promise<boolean>;
  saveRules: (rules: Rules) => Promise<boolean>;
  reply: (id: string, answer: string) => Promise<boolean>;
  reset: () => Promise<boolean>;
}

const OfficeContext = createContext<OfficeValue | null>(null);

async function send(url: string, init?: RequestInit): Promise<{ state: AppState; error?: string; created?: number }> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const data = (await response.json()) as { state?: AppState; error?: string; created?: number };
  if (!response.ok || !data.state) throw new Error(data.error || "Não consegui falar com o escritório.");
  return { state: data.state, created: data.created };
}

export function OfficeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ceremony, setCeremony] = useState<Ceremony | null>(null);

  async function refresh() {
    const data = await send("/api/state");
    setState(data.state);
  }

  useEffect(() => {
    refresh().catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Falha ao abrir a conta.");
    });
  }, []);

  async function mutate(url: string, init?: RequestInit): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const data = await send(url, init);
      setState(data.state);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao salvar.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function runSquad() {
    setBusy(true);
    setError(null);
    setCeremony({ step: 0, done: false, created: 0, pending: 0, blocked: 0 });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let step = 0;
    const timer = window.setInterval(() => {
      step = Math.min(step + 1, BEATS.length - 1);
      setCeremony((current) => (current && !current.done ? { ...current, step } : current));
    }, reduce ? 80 : 420);
    try {
      const [data] = await Promise.all([
        send("/api/run", { method: "POST" }),
        new Promise((resolve) => window.setTimeout(resolve, reduce ? 200 : BEATS.length * 420 + 200)),
      ]);
      window.clearInterval(timer);
      const ids = new Set(data.state.meetings[0]?.actionIds ?? []);
      const fresh = data.state.actions.filter((action) => ids.has(action.id));
      setState(data.state);
      setCeremony({
        step: BEATS.length - 1,
        done: true,
        created: fresh.length,
        pending: fresh.filter((action) => action.status === "pendente").length,
        blocked: fresh.filter((action) => action.status === "bloqueada").length,
      });
    } catch (reason) {
      window.clearInterval(timer);
      setCeremony(null);
      setError(reason instanceof Error ? reason.message : "Não foi possível rodar o squad.");
    } finally {
      setBusy(false);
    }
  }

  const value = useMemo<OfficeValue>(
    () => ({
      state,
      busy,
      error,
      ceremony,
      beats: BEATS,
      refresh,
      runSquad,
      closeCeremony: () => setCeremony(null),
      decide: (id, decision) => mutate(`/api/actions/${id}`, { method: "POST", body: JSON.stringify({ decision }) }),
      saveRules: (rules) => mutate("/api/rules", { method: "PUT", body: JSON.stringify(rules) }),
      reply: (id, answer) => mutate(`/api/questions/${id}`, { method: "POST", body: JSON.stringify({ answer }) }),
      reset: () => mutate("/api/reset", { method: "POST" }),
    }),
    [state, busy, error, ceremony],
  );

  return <OfficeContext.Provider value={value}>{children}</OfficeContext.Provider>;
}

export function useOffice(): OfficeValue {
  const value = useContext(OfficeContext);
  if (!value) throw new Error("useOffice fora do escritório");
  return value;
}
