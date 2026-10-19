import type { Metadata } from "next";
import { Painel } from "@/components/office/painel";

export const metadata: Metadata = { title: "Painel" };

export default function Page() {
  return <Painel />;
}
