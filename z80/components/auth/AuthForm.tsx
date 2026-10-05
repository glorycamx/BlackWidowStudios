"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getAuthProvider } from "@/lib/auth";
import { EASE } from "@/lib/motion";

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2">
      <span className="text-[13px] text-fg-2">{label}</span>
      <input {...props} className="h-12 rounded-[12px] bg-white/[0.02] px-4 text-[15px] text-white placeholder:text-fg-4 hairline transition-shadow focus:shadow-[inset_0_0_0_1px_rgba(143,156,255,0.6)] focus:outline-none" />
    </label>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const auth = getAuthProvider();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    const name = String(f.get("name") ?? "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await auth.signIn(email, password);
        router.push("/chat");
      } else {
        await auth.signUp(name, email, password);
        router.push("/onboarding");
      }
    } catch {
      setError("Something went wrong. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <motion.div className="w-full max-w-[420px]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
        <p className="label">{mode === "login" ? "Sign in" : "Get started"}</p>
        <h1 className="mt-5 text-[40px] font-semibold leading-[1] tracking-[-0.045em] text-white">{mode === "login" ? "Welcome back." : "Put AI bots to work tonight."}</h1>
        <form className="mt-10 grid gap-4" onSubmit={onSubmit} noValidate>
          {mode === "signup" && <Field label="Your name" name="name" autoComplete="name" placeholder="Alex Rivera" />}
          <Field label="Work email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
          <Field label="Password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 8 characters" required />
          {error && (
            <p className="text-[13px] text-[#ff8ca0]" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={busy} magnetic={false} data-deploy>
            {busy ? (mode === "login" ? "Signing in…" : "Creating workspace…") : mode === "login" ? "Sign in" : "Create workspace"}
          </Button>
        </form>
        <p className="mt-6 text-[13.5px] text-fg-3">
          {mode === "login" ? (
            <>
              New to Z80?{" "}
              <Link href="/signup" className="text-white underline-offset-4 hover:underline">
                Create a workspace
              </Link>
            </>
          ) : (
            <>
              Already have a workspace?{" "}
              <Link href="/login" className="text-white underline-offset-4 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
        {!auth.secure && (
          <p className="mt-10 rounded-[12px] p-4 text-[12.5px] leading-relaxed text-fg-3 hairline">
            Demo build: sign-in is simulated. Credentials are not verified or sent anywhere, and nothing here is secure. Your demo workspace stays in this browser.
          </p>
        )}
      </motion.div>
    </div>
  );
}
