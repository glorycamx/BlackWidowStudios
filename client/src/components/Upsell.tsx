import { useState } from "react";
import { post } from "../api";
import { Icon, WebMark } from "./Icon";
import { useNotifications } from "./Notifications";

interface Props {
  item: string;
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
  soft?: boolean;
  note?: string;
}

// One-tap "I'm interested": pings Cam and Trae's phones as a hot upsell
export function Upsell({ item, eyebrow, title, body, cta = "I'm interested", soft, note }: Props) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useNotifications();
  const go = async () => {
    setBusy(true);
    try {
      const r = await post<{ message: string }>("/client/upgrades", { item, note: note || title });
      setSent(true);
      toast("Request sent 🚀", r.message, "upgrade_request");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`upsell ${soft ? "soft" : ""}`}>
      <div className="web"><WebMark size={130} /></div>
      <div className="eyebrow">{eyebrow}</div>
      <h3>{title}</h3>
      <p className="small">{body}</p>
      <div className="btn-row" style={{ marginTop: 14 }}>
        <button className="btn sm" onClick={go} disabled={busy || sent}>
          {sent ? <><Icon name="check" size={16} /> Cam will reach out</> : <>{cta} <Icon name="arrow" size={16} /></>}
        </button>
      </div>
    </div>
  );
}
