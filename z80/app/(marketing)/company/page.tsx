import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Editorial, Prose } from "@/components/z80/Editorial";

export const metadata: Metadata = { title: "Company" };

export default function CompanyPage() {
  return (
    <Editorial label="Company" title="Super intelligence is here." intro={<p>Z80 gives your business AI bots that never clock out. They find the work, do the work, and only bring you the decisions that need a person.</p>}>
      <Prose>
        <h2>What we believe</h2>
        <p>AI shouldn&apos;t wait for you to ask. Z80 bots run on their own, day and night. They watch, find and act, then text you when something needs a yes.</p>
        <p>Pick the bots you need, or build your own in a sentence. You decide. They do the work.</p>
        <h2>Where we are</h2>
        <p>Z80 is in early access. The bots, apps and features on this site are labelled with their real status.</p>
      </Prose>
      <div className="mt-14">
        <Button variant="primary" size="lg" href="/signup">
          Get started
        </Button>
      </div>
    </Editorial>
  );
}
