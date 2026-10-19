import { updateState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { cost?: number; shippingCost?: number };
  const cost = Number(body.cost);
  const shippingCost = Number(body.shippingCost);
  if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(shippingCost) || shippingCost < 0) {
    return Response.json({ error: "Custo e frete precisam ser números a partir de zero." }, { status: 400 });
  }
  let found = false;
  const state = await updateState((current) => {
    const listing = current.listings.find((item) => item.id === id);
    if (!listing) return current;
    found = true;
    listing.cost = cost;
    listing.shippingCost = shippingCost;
    listing.costKnown = true;
    return current;
  });
  if (!found) return Response.json({ error: "Anúncio não encontrado." }, { status: 404 });
  return Response.json({ state }, { headers: { "Cache-Control": "no-store" } });
}
