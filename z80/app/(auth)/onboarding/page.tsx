import type { Metadata } from "next";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const metadata: Metadata = { title: "Build your workforce", robots: { index: false } };

export default function OnboardingPage() {
  return <Onboarding />;
}
