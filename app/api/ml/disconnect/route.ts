import { createSeed } from "@/lib/seed";
import { clearSession } from "@/lib/ml/session";
import { updateState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearSession();
  const state = await updateState((current) => {
    const seed = createSeed();
    seed.rules = current.rules;
    return seed;
  });
  return Response.json({ state }, { headers: { "Cache-Control": "no-store" } });
}
