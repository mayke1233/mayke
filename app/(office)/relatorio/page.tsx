import type { Metadata } from "next";
import { Relatorio } from "@/components/office/relatorio";

export const metadata: Metadata = { title: "Relatório" };

export default function Page() {
  return <Relatorio />;
}
