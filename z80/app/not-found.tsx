import Link from "next/link";
import { Wordmark } from "@/components/z80/Wordmark";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-center">
      <Link href="/" className="text-[22px]" aria-label="Z80.si home">
        <Wordmark />
      </Link>
      <p className="label mt-16">404 · Signal lost</p>
      <h1 className="mt-5 text-[clamp(36px,5vw,64px)] font-semibold leading-[1] tracking-[-0.045em] text-white">This page isn&apos;t part of the network.</h1>
      <div className="mt-10 flex gap-3">
        <Link href="/" className="inline-flex h-10 items-center rounded-[11px] bg-white px-5 text-[11px] font-medium uppercase tracking-[0.14em] text-black">
          Return home
        </Link>
        <Link href="/command" className="inline-flex h-10 items-center rounded-[11px] px-5 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-1 hairline">
          Open command
        </Link>
      </div>
    </main>
  );
}
