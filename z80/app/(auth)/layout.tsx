import Link from "next/link";
import { Wordmark } from "@/components/z80/Wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-black">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-30%] h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(69,108,255,0.18),rgba(100,91,255,0.06)_40%,transparent_70%)]" />
      <header className="relative z-10 flex h-16 items-center px-5 md:px-10">
        <Link href="/" className="text-[20px]" aria-label="Z80.si home">
          <Wordmark />
        </Link>
      </header>
      <main id="main" className="relative z-10 flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
