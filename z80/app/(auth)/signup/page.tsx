import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Get started" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
