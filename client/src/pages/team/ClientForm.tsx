import { useState } from "react";
import type { Client } from "../../types";
import { PLANS } from "../../../../shared/plans";

export type ClientFields = Pick<Client, "businessName" | "ownerName" | "phone" | "email" | "tier" | "siteUrl" | "status" | "goLiveDate" | "niche" | "notes" | "googleReviewUrl">;

export function ClientForm({ initial, onSubmit, submitLabel }: { initial?: Partial<ClientFields>; onSubmit: (v: ClientFields) => Promise<void>; submitLabel: string }) {
  const [v, setV] = useState<ClientFields>({
    businessName: "", ownerName: "", phone: "", email: "", tier: 2, siteUrl: "", status: "build", goLiveDate: "", niche: "", notes: "", googleReviewUrl: "",
    ...initial,
  } as ClientFields);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const f = (k: keyof ClientFields) => ({
    value: (v[k] ?? "") as string | number,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value }),
  });
  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setErr("");
        try { await onSubmit({ ...v, tier: Number(v.tier) }); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
      }}
    >
      <label>Business name<input {...f("businessName")} required /></label>
      <div className="grid2">
        <label>Owner<input {...f("ownerName")} required /></label>
        <label>Phone<input {...f("phone")} type="tel" /></label>
      </div>
      <label>Email<input {...f("email")} type="email" /></label>
      <div className="grid2">
        <label>Plan<select {...f("tier")}>{[1, 2, 3, 4].map((t) => <option key={t} value={t}>{PLANS[t as 1].name} (${PLANS[t as 1].monthly}/mo)</option>)}</select></label>
        <label>Status<select {...f("status")}><option value="build">Building</option><option value="phase1">Phase 1</option><option value="live">Live</option></select></label>
      </div>
      <div className="grid2">
        <label>Site URL<input {...f("siteUrl")} placeholder="theirbusiness.com" /></label>
        <label>Go-live date<input {...f("goLiveDate")} type="date" /></label>
      </div>
      <label>Niche<input {...f("niche")} placeholder="irrigation, septic, salon…" /></label>
      <label>Google review link<input {...f("googleReviewUrl")} type="url" placeholder="https://g.page/r/…/review" /></label>
      <label>Notes<textarea {...f("notes")} /></label>
      {err && <div className="err">{err}</div>}
      <button className="btn primary" disabled={busy}>{busy ? "Saving…" : submitLabel}</button>
    </form>
  );
}
