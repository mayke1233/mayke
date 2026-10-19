import { validateRules } from "@/lib/rules";
import { updateState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const parsed = validateRules(await request.json());
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const state = await updateState((current) => ({ ...current, rules: parsed.rules }));
  return Response.json({ state }, { headers: { "Cache-Control": "no-store" } });
}
