import type { Metadata } from "next";
import { Aprovacoes } from "@/components/office/aprovacoes";

export const metadata: Metadata = { title: "Aprovações" };

export default function Page() {
  return <Aprovacoes />;
}
