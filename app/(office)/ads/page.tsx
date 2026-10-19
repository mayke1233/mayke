import type { Metadata } from "next";
import { Ads } from "@/components/office/ads";

export const metadata: Metadata = { title: "Ads" };

export default function Page() {
  return <Ads />;
}
