import { useNavigate } from "react-router-dom";
import { post } from "../../api";
import { useMe } from "../../App";
import { PushBanner } from "../../components/Layout";
import { ChangePassword } from "../../components/ChangePassword";
import { Group, Page, Row, Section } from "../../components/Page";
import { useNotifications } from "../../components/Notifications";

export default function TeamAccount() {
  const { me, setMe } = useMe();
  const nav = useNavigate();
  const { toast } = useNotifications();
  return (
    <Page page="account" back={{ to: "/team", label: "Inbox" }} heading={me?.name || "Account"} blurb={me?.email}>
      <Section title="Notifications">
        <PushBanner />
        <Group>
          <Row onClick={async () => { await post("/push/test"); toast("Buzz check", "This is what an escalation feels like.", "escalation"); }} title="Send a test notification" />
        </Group>
      </Section>
      <Section title="Password">
        <ChangePassword />
      </Section>
      <button className="btn block" onClick={async () => { await post("/auth/logout"); setMe(null); nav("/"); }}>Sign out</button>
    </Page>
  );
}
