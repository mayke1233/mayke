import type { Metadata } from "next";
import { Sac } from "@/components/office/sac";

export const metadata: Metadata = { title: "SAC" };

export default function Page() {
  return <Sac />;
}
