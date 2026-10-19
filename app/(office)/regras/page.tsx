import type { Metadata } from "next";
import { Regras } from "@/components/office/regras";

export const metadata: Metadata = { title: "Regras" };

export default function Page() {
  return <Regras />;
}
