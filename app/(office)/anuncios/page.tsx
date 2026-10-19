import type { Metadata } from "next";
import { Anuncios } from "@/components/office/anuncios";

export const metadata: Metadata = { title: "Anúncios" };

export default function Page() {
  return <Anuncios />;
}
