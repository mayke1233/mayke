import { NextResponse } from "next/server";
import { exchangeCode } from "@/lib/ml/client";
import { writeLastError } from "@/lib/ml/session";
import { syncAccount } from "@/lib/ml/sync";
import { updateState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("error")) {
    await writeLastError("A autorização foi cancelada no Mercado Livre.");
    return NextResponse.redirect(new URL("/conexao?erro=negado", url));
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    await writeLastError("O Mercado Livre não devolveu o código de autorização.");
    return NextResponse.redirect(new URL("/conexao?erro=codigo", url));
  }
  try {
    await exchangeCode(code, state);
    await updateState((current) => syncAccount(current));
    await writeLastError(null);
    return NextResponse.redirect(new URL("/painel", url));
  } catch (error) {
    await writeLastError(error instanceof Error ? error.message : "Não foi possível concluir a conexão.");
    return NextResponse.redirect(new URL("/conexao?erro=token", url));
  }
}
