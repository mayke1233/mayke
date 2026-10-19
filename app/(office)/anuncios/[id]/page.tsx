import type { Metadata } from "next";
import { Anuncio } from "@/components/office/anuncio";

export const metadata: Metadata = { title: "Anúncio" };

export default function Page() {
  return <Anuncio />;
}
