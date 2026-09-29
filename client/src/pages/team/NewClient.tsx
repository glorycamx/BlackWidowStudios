import { useNavigate } from "react-router-dom";
import { post } from "../../api";
import { ClientForm } from "./ClientForm";
import { Page } from "../../components/Page";

export default function NewClient() {
  const nav = useNavigate();
  return (
    <Page page="newClient" back={{ to: "/team/clients", label: "Clients" }} blurb="After saving, create their login and add the lead form to their site.">
      <div className="group" style={{ padding: 16 }}>
        <ClientForm submitLabel="Create client" onSubmit={async (v) => { const r = await post("/team/clients", v); nav(`/team/clients/${r.client.id}`); }} />
      </div>
    </Page>
  );
}
