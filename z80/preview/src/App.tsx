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
import CommandPage from "@/app/(app)/command/page";
import MissionsPage from "@/app/(app)/missions/page";
import WorkforcePage from "@/app/(app)/workforce/page";
import ApprovalsPage from "@/app/(app)/approvals/page";
import ActivityPage from "@/app/(app)/activity/page";
import MemoryPage from "@/app/(app)/memory/page";
import ConnectionsPage from "@/app/(app)/connections/page";
import SettingsPage from "@/app/(app)/settings/page";
import NotFound from "@/app/not-found";
import { AgentProfile } from "@/components/agents/AgentProfile";
import { MissionView } from "@/components/missions/MissionView";
import { AgentWorkspace } from "@/components/workforce/AgentWorkspace";
import { Footer } from "@/components/z80/Footer";
import { getAgentBySlug } from "@/data/agents";
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
  "/command": () => <CommandPage />,
  "/missions": () => <MissionsPage />,
  "/workforce": () => <WorkforcePage />,
  "/approvals": () => <ApprovalsPage />,
  "/activity": () => <ActivityPage />,
  "/memory": () => <MemoryPage />,
  "/connections": () => <ConnectionsPage />,
  "/settings": () => <SettingsPage />,
};

function Route({ path }: { path: string }) {
  if (marketing[path]) return <MarketingLayout>{marketing[path]()}</MarketingLayout>;
  if (auth[path]) return <AuthLayout>{auth[path]()}</AuthLayout>;
  if (product[path]) return <AppLayout>{product[path]()}</AppLayout>;

  const agent = path.match(/^\/agents\/([^/]+)$/);
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
  const mission = path.match(/^\/missions\/([^/]+)$/);
  if (mission)
    return (
      <AppLayout>
        <Suspense>
          <MissionView id={mission[1]} />
        </Suspense>
      </AppLayout>
    );
  const ws = path.match(/^\/workforce\/([^/]+)$/);
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
