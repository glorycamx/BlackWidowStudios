import type { Metadata } from "next";
import { Editorial, Prose } from "@/components/z80/Editorial";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <Editorial label="Terms" title="Terms">
      <Prose>
        <p><strong>Placeholder.</strong> Terms of service for Z80 have not been published yet. They will appear here before general availability.</p>
        <p>The product demo on this site simulates agent work. Results shown in the demo — prospects, campaigns, briefs — are generated sample data, not real research.</p>
      </Prose>
    </Editorial>
  );
}
