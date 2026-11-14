"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/config/site";
import { Wordmark } from "@/components/brand/mark";

const LINKS = [
  { href: "/start", label: "Find my money" },
  { href: "/guides", label: "2026 rules guides" },
  { href: "/pricing", label: "Pricing" },
  { href: "/app", label: "My plan" },
];

export function SiteFooter() {
  const path = usePathname();
  if (path.startsWith("/app")) return null;
  return (
    <footer className="bg-[#0b3b32] text-white">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr]">
        <div>
          <Wordmark light />
          <p className="mt-4 max-w-sm text-white/70">{site.tagline}. Built for working parents in the US.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-3 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} prefetch={false} className="text-white/75 hover:text-white">{l.label}</Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-5xl space-y-1 px-4 py-6 text-xs text-white/55">
          <p>{site.disclaimer}</p>
          <p>© {new Date().getFullYear()} {site.name}</p>
        </div>
      </div>
    </footer>
  );
}