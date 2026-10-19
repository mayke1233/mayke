import { readSession } from "@/lib/ml/session";
import { syncAccount } from "@/lib/ml/sync";
import { updateState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await readSession())) {
    return Response.json({ error: "Conecte a conta do Mercado Livre antes de sincronizar." }, { status: 400 });
  }
  try {
    const state = await updateState((current) => syncAccount(current));
    return Response.json({ state }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "A sincronização falhou." },
      { status: 502 },
    );
  }
}
