import { createSeed } from "@/lib/seed";
import { updateState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const state = await updateState(() => createSeed());
  return Response.json({ state }, { headers: { "Cache-Control": "no-store" } });
}
