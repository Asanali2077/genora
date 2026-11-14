import Link from "next/link";
import { site } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-2xl font-extrabold tracking-tight text-pine">
          {site.name.toLowerCase()}
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link href="/pricing" className="tap inline-flex items-center rounded-md px-3 hover:bg-muted">
            Pricing
          </Link>
          <Link href="/app" className="tap inline-flex items-center rounded-md px-3 hover:bg-muted">
            My plan
          </Link>
        </nav>
      </div>
    </header>
  );
}
