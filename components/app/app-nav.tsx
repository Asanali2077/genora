"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/app", label: "Pulse" },
  { href: "/reveal", label: "Benefits" },
  { href: "/app/coverage", label: "School breaks" },
  { href: "/app/claims", label: "Claims" },
];

export function AppNav() {
  const path = usePathname();
  return (
    <nav aria-label="Your plan" className="border-b bg-card">
      <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4">
        {TABS.map((t) => {
          const on = path === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={cn("tap inline-flex shrink-0 items-center border-b-2 px-3 text-sm font-semibold", on ? "border-pine text-pine" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
