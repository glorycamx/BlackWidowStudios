import type { Metadata } from "next";
import { Editorial, Prose } from "@/components/z80/Editorial";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <Editorial label="Privacy" title="Privacy">
      <Prose>
        <p><strong>Placeholder.</strong> The formal privacy policy for Z80 has not been published yet. It will appear here before general availability.</p>
        <h2>This demo</h2>
        <p>The product demo on this site runs in your browser. Missions, activity, memory and settings you create are stored in your browser&apos;s local storage and are not sent to Z80 servers, except for the objective text you submit for planning, which is processed by this site&apos;s API and not stored.</p>
        <p>You can erase all demo data at any time from Settings → Reset demo workspace, or by clearing your browser storage.</p>
      </Prose>
    </Editorial>
  );
}
