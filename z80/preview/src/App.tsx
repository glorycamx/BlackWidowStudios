import { Suspense, type ReactNode } from "react";
import { Providers } from "@/components/z80/Providers";
import MarketingLayout from "@/app/(marketing)/layout";
import AppLayout from "@/app/(app)/layout";
import AuthLayout from "@/app/(auth)/layout";
import HomePage from "@/app/(marketing)/page";
import PricingPage from "@/app/(marketing)/pricing/page";
import SecurityPage from "@/app/(marketing)/security/page";
import PrivacyPage from "@/app/(marketing)/privacy/page";
import TermsPage from "@/app/(marketing)/terms/page";
import CompanyPage from "@/app/(marketing)/company/page";
import LoginPage from "@/app/(auth)/login/page";
import SignupPage from "@/app/(auth)/signup/page";
import OnboardingPage from "@/app/(auth)/onboarding/page";
import CommandPage from "@/app/(app)/chat/page";
import LivePage from "@/app/(app)/live/page";
import RoutinesPage from "@/app/(app)/routines/page";
import CalendarPage from "@/app/(app)/calendar/page";
import MissionsPage from "@/app/(app)/jobs/page";
import WorkforcePage from "@/app/(app)/team/page";
import ApprovalsPage from "@/app/(app)/approvals/page";
import ActivityPage from "@/app/(app)/activity/page";
import MemoryPage from "@/app/(app)/memory/page";
import ConnectionsPage from "@/app/(app)/apps/page";
import SettingsPage from "@/app/(app)/settings/page";
import NotFound from "@/app/not-found";
import { AgentProfile } from "@/components/agents/AgentProfile";
import { MissionView } from "@/components/missions/MissionView";
import { AgentWorkspace } from "@/components/workforce/AgentWorkspace";
import { Footer } from "@/components/z80/Footer";
import { getAgentBySlug } from "@/data/bots";
import { useLocation } from "./shims/nav";

const marketing: Record<string, () => ReactNode> = {
  "/": () => <HomePage />,
  "/pricing": () => <PricingPage />,
  "/security": () => <SecurityPage />,
  "/privacy": () => <PrivacyPage />,
  "/terms": () => <TermsPage />,
  "/company": () => <CompanyPage />,
};

const auth: Record<string, () => ReactNode> = {
  "/login": () => <LoginPage />,
  "/signup": () => <SignupPage />,
  "/onboarding": () => <OnboardingPage />,
};

const product: Record<string, () => ReactNode> = {
  "/live": () => <LivePage />,
  "/routines": () => <RoutinesPage />,
  "/calendar": () => <CalendarPage />,
  "/chat": () => <CommandPage />,
  "/jobs": () => <MissionsPage />,
  "/team": () => <WorkforcePage />,
  "/approvals": () => <ApprovalsPage />,
  "/activity": () => <ActivityPage />,
  "/memory": () => <MemoryPage />,
  "/apps": () => <ConnectionsPage />,
  "/settings": () => <SettingsPage />,
};

/** Same aliases as next.config.ts redirects. */
const ALIAS: [RegExp, string][] = [
  [/^\/signals$/, "/live"],
  [/^\/command$/, "/chat"],
  [/^\/workforce$/, "/team"],
  [/^\/missions$/, "/jobs"],
  [/^\/connections$/, "/apps"],
  [/^\/workforce\/(.+)$/, "/team/$1"],
  [/^\/missions\/(.+)$/, "/jobs/$1"],
  [/^\/agents\/(.+)$/, "/bots/$1"],
  [/^\/(team|bots)\/helm$/, "/$1/manager"],
  [/^\/(team|bots)\/lookout$/, "/$1/lead-hunter"],
  [/^\/(team|bots)\/beacon$/, "/$1/content-creator"],
];

function resolve(path: string) {
  let p = path;
  for (const [re, to] of ALIAS) p = p.replace(re, to);
  return p;
}

function Route({ path: raw }: { path: string }) {
  const path = resolve(raw);
  if (marketing[path]) return <MarketingLayout>{marketing[path]()}</MarketingLayout>;
  if (auth[path]) return <AuthLayout>{auth[path]()}</AuthLayout>;
  if (product[path]) return <AppLayout>{product[path]()}</AppLayout>;

  const agent = path.match(/^\/bots\/([^/]+)$/);
  if (agent) {
    const a = getAgentBySlug(agent[1]);
    if (!a) return <NotFound />;
    return (
      <MarketingLayout>
        <AgentProfile agent={a} />
        <Footer />
      </MarketingLayout>
    );
  }
  const mission = path.match(/^\/jobs\/([^/]+)$/);
  if (mission)
    return (
      <AppLayout>
        <Suspense>
          <MissionView id={mission[1]} />
        </Suspense>
      </AppLayout>
    );
  const ws = path.match(/^\/team\/([^/]+)$/);
  if (ws)
    return (
      <AppLayout>
        <Suspense>
          <AgentWorkspace slug={ws[1]} />
        </Suspense>
      </AppLayout>
    );
  return <NotFound />;
}

export function App() {
  const { path } = useLocation();
  return (
    <Providers>
      {/* Keyed by path so each page mounts fresh, as in the real app. */}
      <Route key={path} path={path} />
    </Providers>
  );
}
