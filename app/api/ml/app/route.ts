import { isRedirectUri, maskClientId, readApp, saveApp } from "@/lib/ml/config";
import { readLastError, readSession } from "@/lib/ml/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const app = await readApp();
  const session = await readSession();
  return Response.json(
    {
      configured: Boolean(app),
      pkce: app?.pkce ?? false,
      redirectUri: app?.redirectUri ?? "",
      clientIdHint: app ? maskClientId(app.clientId) : null,
      connected: Boolean(session),
      nickname: session?.nickname ?? null,
      userId: session?.userId ?? null,
      lastError: await readLastError(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { clientId?: string; clientSecret?: string; redirectUri?: string; pkce?: boolean };
  const clientId = String(body.clientId ?? "").trim();
  const clientSecret = String(body.clientSecret ?? "").trim();
  const redirectUri = String(body.redirectUri ?? "").trim();
  if (!clientId || !clientSecret) {
    return Response.json({ error: "Informe o App ID e a Secret Key do aplicativo." }, { status: 400 });
  }
  if (!isRedirectUri(redirectUri)) {
    return Response.json({ error: "A URL de redirecionamento precisa ser http(s) e terminar em /api/ml/callback." }, { status: 400 });
  }
  await saveApp({ clientId, clientSecret, redirectUri, pkce: Boolean(body.pkce) });
  return Response.json({ ok: true, clientIdHint: maskClientId(clientId) }, { headers: { "Cache-Control": "no-store" } });
}
