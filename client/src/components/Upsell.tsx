import { useState } from "react";
import { post } from "../api";
import { useNotifications } from "./Notifications";

interface Props {
  item: string;
  title: string;
  body: string;
  cta?: string;
  note?: string;
  // Older call sites pass these; the minimal layout ignores them
  eyebrow?: string;
  soft?: boolean;
}

// One quiet line. "I'm interested" buzzes Cam and Trae as a hot upsell.
export function Upsell({ item, title, body, cta = "Interested", note }: Props) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useNotifications();
  const go = async () => {
    setBusy(true);
    try {
      const r = await post<{ message: string }>("/client/upgrades", { item, note: note || title });
      setSent(true);
      toast("Request sent", r.message, "upgrade_request");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="nudge">
      <div className="grow">
        <div className="t">{title}</div>
        <div className="s">{body}</div>
      </div>
      <button className="btn sm" onClick={go} disabled={busy || sent}>{sent ? "Sent ✓" : cta}</button>
    </div>
  );
}
