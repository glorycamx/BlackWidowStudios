import { useNavigate } from "react-router-dom";
import { post } from "../../api";
import { ClientForm } from "./ClientForm";

export default function NewClient() {
  const nav = useNavigate();
  return (
    <main className="main">
      <div className="page-head">
        <h1>New client</h1>
        <p className="small muted" style={{ marginTop: 4 }}>After saving, create their login and paste the lead form snippet into their site.</p>
      </div>
      <div>
        <ClientForm submitLabel="Create client" onSubmit={async (v) => { const r = await post("/team/clients", v); nav(`/team/clients/${r.client.id}`); }} />
      </div>
    </main>
  );
}
