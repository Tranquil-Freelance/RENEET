import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/pricing", label: "Pricing (INR)" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/refunds", label: "Refunds" },
] as const;

export function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-[var(--color-brand)]"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white font-bold text-xs">
              P
            </span>
            PrepInsight
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-[var(--color-brand)]">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
        <p className="text-xs uppercase tracking-wider text-ink-muted font-medium">
          Last updated: {lastUpdated}
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-serif font-semibold tracking-tight">
          {title}
        </h1>
        <div className="mt-8 space-y-4 text-sm md:text-base text-ink leading-relaxed [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-serif [&_h2]:font-semibold [&_h2]:text-ink [&_h2:first-child]:mt-0 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:text-[var(--color-brand)] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[var(--color-brand-600)]">
          {children}
        </div>
      </main>

      <footer className="border-t border-line py-8 px-4 text-center text-xs text-ink-muted">
        <p>© {new Date().getFullYear()} PrepInsight · Re-NEET 2026</p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[var(--color-brand)]">
              {l.label}
            </Link>
          ))}
          <Link href="/" className="hover:text-[var(--color-brand)]">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
