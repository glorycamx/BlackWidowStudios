"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PermissionSwitch } from "@/components/app/PermissionSwitch";
import { PageHeader, PageWrap, Panel } from "@/components/app/primitives";
import { Button } from "@/components/ui/Button";
import { getAuthProvider, type AuthUser } from "@/lib/auth";
import { playSound } from "@/lib/sound";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { cn } from "@/lib/utils";

function Toggle({ on, onChange, label }: { on: boolean; onChange(v: boolean): void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("relative h-6 w-11 rounded-full transition-colors duration-300", on ? "bg-white" : "bg-white/[0.08] hairline")}
    >
      <span className={cn("absolute top-1 h-4 w-4 rounded-full transition-all duration-300 ease-[var(--ease-z)]", on ? "left-6 bg-black" : "left-1 bg-fg-2")} />
    </button>
  );
}

export function SettingsView() {
  const router = useRouter();
  const settings = useWorkspace((s) => s.settings);
  const org = useWorkspace((s) => s.org);
  const permissions = useWorkspace((s) => s.permissions);
  const [name, setName] = useState(org?.name ?? "");
  const [desc, setDesc] = useState(org?.description ?? "");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [saved, setSaved] = useState(false);
  const auth = getAuthProvider();

  useEffect(() => {
    void auth.getUser().then(setUser);
  }, [auth]);

  return (
    <PageWrap className="max-w-[920px]">
      <PageHeader label="Workspace" title="Settings" />
      <nav aria-label="More" className="mt-8 grid grid-cols-2 gap-2 lg:hidden">
        {[
          ["Memory", "/memory"],
          ["Connections", "/connections"],
          ["Activity", "/activity"],
          ["Approvals", "/approvals"],
        ].map(([label, href]) => (
          <Link key={href} href={href} className="flex h-12 items-center justify-between rounded-[12px] px-4 text-[14px] text-white hairline">
            {label} <span className="text-fg-3">→</span>
          </Link>
        ))}
      </nav>
      <div className="mt-12 space-y-6">
        <Panel title="Organization">
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              workspace.setOrg({ name: name.trim() || "Your company", description: desc.trim(), focus: org?.focus ?? "" });
              setSaved(true);
              setTimeout(() => setSaved(false), 1800);
            }}
          >
            <label className="grid gap-2">
              <span className="text-[13px] text-fg-2">Company name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-[10px] bg-transparent px-3 text-[14px] text-white hairline focus:outline-none" />
            </label>
            <label className="grid gap-2">
              <span className="text-[13px] text-fg-2">What the company does</span>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="resize-none rounded-[10px] bg-transparent px-3 py-2.5 text-[14px] text-white hairline focus:outline-none" />
            </label>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="solid" size="sm" magnetic={false}>
                Save
              </Button>
              {saved && <span className="text-[12.5px] text-fg-2" role="status">Saved to organization memory.</span>}
            </div>
          </form>
        </Panel>

        <Panel title="Interface">
          <div className="flex items-center justify-between gap-6 py-1">
            <div>
              <div className="text-[14.5px] text-white">Interface sound</div>
              <div className="mt-0.5 text-[13px] text-fg-3">Subtle tones for deploys, completions, approvals and replies.</div>
            </div>
            <Toggle
              on={settings.sound}
              label="Interface sound"
              onChange={(v) => {
                workspace.setSettings({ sound: v });
                if (v) playSound("complete", true);
              }}
            />
          </div>
          <div className="mt-5 flex items-center justify-between gap-6 border-t border-line pt-5">
            <div>
              <div className="text-[14.5px] text-white">Demo speed</div>
              <div className="mt-0.5 text-[13px] text-fg-3">How fast simulated missions run.</div>
            </div>
            <div role="radiogroup" aria-label="Demo speed" className="flex rounded-[9px] p-[3px] hairline">
              {[1, 2, 4].map((sp) => (
                <button
                  key={sp}
                  role="radio"
                  aria-checked={settings.demoSpeed === sp}
                  onClick={() => workspace.setSettings({ demoSpeed: sp })}
                  className={cn("h-7 rounded-[7px] px-3 font-mono text-[11px]", settings.demoSpeed === sp ? "bg-white/[0.08] text-white" : "text-fg-3")}
                >
                  {sp}×
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Permissions">
          <ul>
            {permissions.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 border-b border-white/[0.05] py-3.5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[14px] text-white">{p.action}</div>
                  <div className="text-[12.5px] text-fg-3">{p.detail}</div>
                </div>
                <PermissionSwitch value={p.level} onChange={(l) => workspace.setPermission(p.id, l)} label={p.action} />
              </li>
            ))}
          </ul>
        </Panel>

        <section id="account">
          <Panel title="Account">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[14.5px] text-white">{user?.name ?? "Demo visitor"}</div>
                <div className="text-[13px] text-fg-3">{user?.email ?? "Not signed in"}</div>
              </div>
              {user ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    await auth.signOut();
                    setUser(null);
                    router.push("/");
                  }}
                >
                  Sign out
                </Button>
              ) : (
                <Button variant="secondary" size="sm" href="/login">
                  Sign in
                </Button>
              )}
            </div>
            {!auth.secure && <p className="mt-4 text-[12.5px] text-fg-3">Authentication in this demo build is simulated and provides no security. Data stays in this browser.</p>}
          </Panel>
        </section>

        <Panel title="Demo workspace">
          <div className="flex flex-col gap-4">
            <p className="text-[13.5px] text-fg-2">All missions, activity and memory in this demo live in your browser.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => workspace.resetDemo()}>
                Reset demo workspace
              </Button>
              <Button variant="secondary" size="sm" onClick={() => workspace.clearWorkspace()}>
                Start empty
              </Button>
              <Button variant="ghost" size="sm" onClick={() => workspace.clearConversation()}>
                Clear conversation
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </PageWrap>
  );
}
