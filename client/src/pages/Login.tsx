import { useState } from "react";
import { DEMO, post } from "../api";
import { useMe } from "../App";
import { WebMark } from "../components/Icon";

export default function Login() {
  const { setMe } = useMe();
  const [email, setEmail] = useState(DEMO ? "demo@blackwidow.studio" : "");
  const [password, setPassword] = useState(DEMO ? "demo1234" : "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e?: React.FormEvent, as?: string) => {
    e?.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { user } = await post("/auth/login", { email: as || email, password: password || "demo" });
      setMe(user);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="row" style={{ gap: 10 }}>
        <WebMark size={30} />
        <div className="brand">Black Widow Studios</div>
      </div>
      <div>
        <h1>Sign in</h1>
        <p className="muted small" style={{ marginTop: 6 }}>Use the email Cam set up for you.</p>
      </div>
      <form className="form" onSubmit={submit}>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {err && <div className="err">{err}</div>}
        <button className="btn primary block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        {DEMO && (
          <button type="button" className="btn ghost block" onClick={() => submit(undefined, "admin@blackwidow.studio")}>Preview the team view</button>
        )}
      </form>
      <p className="tiny muted">Trouble signing in? Text Cam.</p>
    </div>
  );
}
