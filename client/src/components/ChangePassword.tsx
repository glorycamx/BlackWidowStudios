import { useState } from "react";
import { post } from "../api";
import { useNotifications } from "./Notifications";

export function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useNotifications();
  return (
    <form
      className="form group"
      style={{ padding: 16 }}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setErr("");
        try {
          await post("/auth/password", { current, next });
          setCurrent(""); setNext("");
          toast("Password changed", "Other devices were signed out.", "offer");
        } catch (e: any) {
          setErr(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="pw-current">Current password<input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></label>
      <label htmlFor="pw-next">New password<input id="pw-next" type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required /></label>
      {err && <div className="err">{err}</div>}
      <button className="btn primary" disabled={busy}>{busy ? "Saving…" : "Change password"}</button>
    </form>
  );
}
