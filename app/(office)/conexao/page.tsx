import type { Metadata } from "next";
import { Suspense } from "react";
import { Conexao } from "@/components/office/conexao";

export const metadata: Metadata = { title: "Conectar" };

export default function Page() {
  return (
    <Suspense fallback={<p className="loading">Abrindo a conexão…</p>}>
      <Conexao />
    </Suspense>
  );
}
