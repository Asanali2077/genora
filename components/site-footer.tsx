"use client";

import { usePathname } from "next/navigation";
import { site } from "@/config/site";

export function SiteFooter() {
  const path = usePathname();
  if (path.startsWith("/app")) return null;
  return (
    <footer className="border-t border-ink/[0.07] px-4 py-10 text-sm text-muted-foreground">
      <div className="mx-auto max-w-5xl space-y-2">
        <p>{site.disclaimer}</p>
        <p>© {new Date().getFullYear()} {site.name}</p>
      </div>
    </footer>
  );
}