import type { Metadata } from "next";
import { Reuniao } from "@/components/office/reuniao";

export const metadata: Metadata = { title: "Reunião" };

export default function Page() {
  return <Reuniao />;
}
