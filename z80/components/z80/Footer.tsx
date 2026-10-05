import Link from "next/link";
import { Wordmark } from "@/components/z80/Wordmark";
import { footerNav } from "@/config/site";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-10">
        <div>
          <Link href="/" aria-label="Z80.si home" className="text-[18px]">
            <Wordmark />
          </Link>
          <p className="mt-2 text-[13px] text-fg-3">Your AI bots never clock out.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-7 gap-y-3">
            {footerNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[13px] text-fg-3 transition-colors hover:text-fg-1">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="label">© Z80</p>
      </div>
    </footer>
  );
}
