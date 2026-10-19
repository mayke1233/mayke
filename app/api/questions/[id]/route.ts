import { answerQuestion } from "@/lib/engine";
import { publishManualAnswer } from "@/lib/ml/publish";
import { updateState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { answer?: string };
  const answer = String(body.answer ?? "");
  if (answer.trim().length < 8) {
    return Response.json({ error: "Escreva uma resposta com pelo menos 8 caracteres." }, { status: 400 });
  }
  let changed = false;
  const state = await updateState(async (current) => {
    const next = answerQuestion(current, id, answer);
    changed = next !== current;
    if (!changed) return current;
    return publishManualAnswer(current, next, id);
  });
  if (!changed) {
    return Response.json({ error: "Essa pergunta já foi respondida." }, { status: 409 });
  }
  return Response.json({ state }, { headers: { "Cache-Control": "no-store" } });
}
