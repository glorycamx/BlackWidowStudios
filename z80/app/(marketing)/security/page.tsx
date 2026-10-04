import type { Metadata } from "next";
import { Editorial, Prose } from "@/components/z80/Editorial";

export const metadata: Metadata = { title: "Security", description: "How Z80 keeps humans in control of an AI workforce." };

export default function SecurityPage() {
  return (
    <Editorial label="Security" title="Humans decide. Z80 executes." intro={<p>Giving software access to your business is a serious decision. Control is designed into Z80, not added on top.</p>}>
      <Prose>
        <h2>Explicit permissions</h2>
        <p>Every action an intelligence can take is governed by a workspace rule with one of three levels: <strong>autonomous</strong>, <strong>ask first</strong>, or <strong>blocked</strong>. Defaults are conservative — anything that leaves your company asks first, and destructive actions are blocked.</p>
        <h2>Human approval gates</h2>
        <p>When a mission reaches an action that requires approval, it stops and waits. You see exactly what will happen before it happens, and you can approve, hold, or deny.</p>
        <h2>Activity history</h2>
        <p>Every meaningful action is recorded: which intelligence acted, what it did, and when. The activity log is the audit trail for your workforce.</p>
        <h2>Revoke access instantly</h2>
        <p>Pause any intelligence or disconnect any tool at any time. Missions that depend on it wait until you decide what happens next.</p>
        <h2>Organization-level isolation</h2>
        <p>Memory, connections and missions belong to a single workspace and are never shared between organizations.</p>
        <h2>Current status</h2>
        <p>Z80 is in early access. This site does not claim third-party security certifications. If your organization needs specific assurances, talk to us before connecting production systems.</p>
      </Prose>
    </Editorial>
  );
}
