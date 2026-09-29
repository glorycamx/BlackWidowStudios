import { useNavigate } from "react-router-dom";
import { post } from "../api";
import { useMe } from "../App";
import { PushBanner } from "../components/Layout";
import { useNotifications } from "../components/Notifications";
import { Group, Page, PageBadge, Row, Section } from "../components/Page";
import { ChangePassword } from "../components/ChangePassword";
import { Icon } from "../components/Icon";

export default function More() {
  const { info, setMe } = useMe();
  const nav = useNavigate();
  const { toast } = useNotifications();
  return (
    <Page page="account" back={{ to: "/", label: "Home" }} heading={info?.client?.businessName || "Account"} blurb={info?.user?.email}>
      <Section title="Your business">
        <Group>
          <Row to="/plan" lead={<PageBadge page="plan" size={34} />} title="Plan & upgrades" meta="What's included and what's next" />
          <Row to="/revisions" lead={<PageBadge page="edits" size={34} />} title="Edits" meta="Request changes and track them" />
          <Row to="/refer" lead={<PageBadge page="earn" size={34} />} title="Earn" meta="Your referral link and credit" />
        </Group>
      </Section>
      <Section title="Help">
        <Group>
          <Row to="/help" lead={<PageBadge page="assistant" size={34} />} title="Assistant" meta="Answers in seconds, any time" />
          <Row href="mailto:hello@blackwidow.studio" lead={<span className="row-lead-icon"><Icon name="mail" size={17} /></span>} title="Email Cam & Trae" meta="hello@blackwidow.studio · they reply until 7:30 PM ET" />
        </Group>
      </Section>
      <Section title="Notifications">
        <PushBanner />
        <Group>
          <Row onClick={async () => { await post("/push/test"); toast("Buzz check", "This is what a new lead feels like.", "lead"); }} title="Send a test notification" />
        </Group>
      </Section>
      <Section title="Password">
        <ChangePassword />
      </Section>
      <button className="btn block" onClick={async () => { await post("/auth/logout"); setMe(null); nav("/"); }}>Sign out</button>
    </Page>
  );
}
