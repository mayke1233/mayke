import { readState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readState();
  return Response.json({ state }, { headers: { "Cache-Control": "no-store" } });
}
