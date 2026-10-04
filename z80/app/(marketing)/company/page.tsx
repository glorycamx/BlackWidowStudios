import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Editorial, Prose } from "@/components/z80/Editorial";

export const metadata: Metadata = { title: "Company" };

export default function CompanyPage() {
  return (
    <Editorial label="Company" title="Superintelligence that works for you." intro={<p>Z80 builds autonomous AI agents that run around the clock. They find the work, do the work, and bring you only the decisions that need a person.</p>}>
      <Prose>
        <h2>What we believe</h2>
        <p>AI shouldn&apos;t wait for a prompt. Z80 agents run on their own, around the clock: they watch, find, decide and act, and bring you only the decisions that need a person.</p>
        <p>One chat. Multiple intelligences. Humans decide; Z80 executes.</p>
        <h2>Where we are</h2>
        <p>Z80 is in early access. The intelligences, connections and features on this site are labelled with their real status.</p>
      </Prose>
      <div className="mt-14">
        <Button variant="primary" size="lg" href="/signup" data-deploy>
          Deploy Z80
        </Button>
      </div>
    </Editorial>
  );
}
