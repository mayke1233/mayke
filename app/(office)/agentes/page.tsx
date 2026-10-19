import type { Metadata } from "next";
import { Agentes } from "@/components/office/agentes";

export const metadata: Metadata = { title: "Agentes" };

export default function Page() {
  return <Agentes />;
}
