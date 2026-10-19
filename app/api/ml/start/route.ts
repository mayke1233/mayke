import { NextResponse } from "next/server";
import { beginAuthorization } from "@/lib/ml/client";
import { readApp } from "@/lib/ml/config";
import { redirectHostBlocked } from "@/lib/ml/redirect";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const app = await readApp();
  const here = new URL(request.url);
  if (!app) return NextResponse.redirect(new URL("/conexao?erro=credenciais", here));
  if (redirectHostBlocked(app.redirectUri)) return NextResponse.redirect(new URL("/conexao?erro=bloqueado", here));
  const authorization = await beginAuthorization(app);
  return NextResponse.redirect(authorization);
}
