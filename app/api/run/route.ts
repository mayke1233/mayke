import { runSquad } from "@/lib/engine";
import { updateState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const state = await updateState((current) => runSquad(current, new Date()));
  return Response.json(
    { state, created: state.meetings[0]?.actionIds.length ?? 0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
