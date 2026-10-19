import type { Metadata } from "next";
import { Acoes } from "@/components/office/acoes";

export const metadata: Metadata = { title: "Ações" };

export default function Page() {
  return <Acoes />;
}
