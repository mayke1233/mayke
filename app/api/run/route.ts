import { runSquad } from "@/lib/engine";
import { publishExecuted } from "@/lib/ml/publish";
import { updateState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const state = await updateState(async (current) => {
    const next = runSquad(current, new Date());
    const created = next.meetings[0]?.actionIds ?? [];
    return publishExecuted(current, next, created);
  });
  return Response.json(
    { state, created: state.meetings[0]?.actionIds.length ?? 0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
