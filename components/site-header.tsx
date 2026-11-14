"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const path = usePathname();
  if (path.startsWith("/app")) return null;
  const inApp = path === "/reveal";
  const dark = path === "/";
  return (
    <header className={cn("sticky top-0 z-40 border-b backdrop-blur-md", dark ? "border-white/10 bg-brand-deep/95 text-white" : "border-ink/[0.07] bg-paper/90")}>
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="Genora home" className="rounded-md">
          <Wordmark light={dark} />
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/guides"
            className={cn("tap hidden items-center rounded-lg px-3 text-sm font-semibold sm:inline-flex", path === "/guides" ? "text-brand" : dark ? "text-white/75 hover:text-white" : "text-muted-foreground hover:text-ink")}
          >
            Guides
          </Link>
          <Link
            href="/pricing"
            aria-current={path === "/pricing" ? "page" : undefined}
            className={cn("tap hidden items-center rounded-lg px-3 text-sm font-semibold sm:inline-flex", path === "/pricing" ? "text-brand" : dark ? "text-white/75 hover:text-white" : "text-muted-foreground hover:text-ink")}
          >
            Pricing
          </Link>
          {inApp ? (
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/app" prefetch={false} />}>My plan</Button>
          ) : (
            <Button size="sm" className={dark ? "bg-sun text-ink hover:bg-sun" : undefined} nativeButton={false} render={<Link href="/start" />}>Find my money</Button>
          )}
        </nav>
      </div>
    </header>
  );
}
