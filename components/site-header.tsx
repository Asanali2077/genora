"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const path = usePathname();
  const inApp = path.startsWith("/app") || path === "/reveal";
  return (
    <header className="sticky top-0 z-40 border-b border-ink/[0.07] bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="Genora home" className="rounded-md">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/pricing"
            aria-current={path === "/pricing" ? "page" : undefined}
            className={cn("tap hidden items-center rounded-lg px-3 text-sm font-semibold sm:inline-flex", path === "/pricing" ? "text-pine" : "text-muted-foreground hover:text-ink")}
          >
            Pricing
          </Link>
          {inApp ? (
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/app" />}>My plan</Button>
          ) : (
            <Button size="sm" nativeButton={false} render={<Link href="/start" />}>Find my money</Button>
          )}
        </nav>
      </div>
    </header>
  );
}
