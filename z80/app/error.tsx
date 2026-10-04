"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-center">
      <p className="label text-err">Operation interrupted</p>
      <h1 className="mt-5 max-w-[20ch] text-[clamp(32px,4.5vw,56px)] font-semibold leading-[1.02] tracking-[-0.045em] text-white">Something stopped this screen from loading.</h1>
      <p className="mt-5 max-w-[420px] text-[15px] text-fg-2">Your workforce and missions are unaffected. Try again, or return to Command.</p>
      <div className="mt-10 flex gap-3">
        <button onClick={reset} className="inline-flex h-10 items-center rounded-[11px] bg-white px-5 text-[11px] font-medium text-black">
          Try again
        </button>
        <a href="/command" className="inline-flex h-10 items-center rounded-[11px] px-5 text-[11px] font-medium text-fg-1 hairline">
          Open command
        </a>
      </div>
    </main>
  );
}
