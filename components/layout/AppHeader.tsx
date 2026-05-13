import Link from "next/link";
import { UserNav } from "./UserNav";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-serif text-lg font-semibold text-ink tracking-tight">
          PrepInsights
        </Link>
        <UserNav />
      </div>
    </header>
  );
}
