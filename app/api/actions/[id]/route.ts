import { decide } from "@/lib/engine";
import { updateState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { decision?: string };
  if (body.decision !== "aprovar" && body.decision !== "recusar") {
    return Response.json({ error: "Decisão inválida." }, { status: 400 });
  }
  const decision = body.decision;
  const state = await updateState((current) => decide(current, id, decision));
  return Response.json({ state }, { headers: { "Cache-Control": "no-store" } });
}
