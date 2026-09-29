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
        <span style={{ color: "var(--text)" }}><WebMark size={40} /></span>
        <div className="brand" style={{ fontSize: 14 }}>Black Widow<br />Studios</div>
      </div>
      <div>
        <h1>Your website, your leads, <span className="accent">your team</span>, in your pocket.</h1>
        <p className="muted" style={{ marginTop: 10 }}>Sign in with the email Cam set up for you.</p>
      </div>
      <form className="card form" onSubmit={submit}>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {err && <div className="err">{err}</div>}
        <button className="btn primary block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        {DEMO && (
          <button type="button" className="btn block" onClick={() => submit(undefined, "admin@blackwidow.studio")}>Preview the team view (Cam)</button>
        )}
      </form>
      <p className="tiny muted" style={{ textAlign: "center" }}>Trouble signing in? Text Cam. We pick up until 7:30 PM.</p>
    </div>
  );
}
