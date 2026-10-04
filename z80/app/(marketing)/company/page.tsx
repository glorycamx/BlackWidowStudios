import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Editorial, Prose } from "@/components/z80/Editorial";

export const metadata: Metadata = { title: "Company" };

export default function CompanyPage() {
  return (
    <Editorial label="Company" title="Give every business a workforce." intro={<p>Z80 is building the operating system for AI workforces: describe the outcome, and the right intelligences assemble to do the work.</p>}>
      <Prose>
        <h2>What we believe</h2>
        <p>Business owners shouldn&apos;t have to become prompt engineers. They should say what they need done, keep control of what matters, and see the work happen.</p>
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
