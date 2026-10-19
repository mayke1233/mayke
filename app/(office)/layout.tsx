import { OfficeProvider } from "@/components/office/office-context";
import { Shell } from "@/components/office/shell";

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <OfficeProvider>
      <Shell>{children}</Shell>
    </OfficeProvider>
  );
}
