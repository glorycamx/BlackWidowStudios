import type { Metadata } from "next";
import { AppShell } from "@/components/app/AppShell";
import { THEME_BOOT } from "@/lib/themeBoot";

export const metadata: Metadata = { robots: { index: false } };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Paint the chosen theme before anything else renders. */}
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      <AppShell>{children}</AppShell>
    </>
  );
}
