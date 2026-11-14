"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, Landmark, LayoutGrid, Lock, Receipt, Settings2 } from "lucide-react";
import { Mark } from "@/components/brand/mark";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "Overview", icon: LayoutGrid, pro: false },
  { href: "/app/benefits", label: "Benefits", icon: Landmark, pro: false },
  { href: "/app/coverage", label: "School breaks", icon: CalendarDays, pro: true },
  { href: "/app/claims", label: "Claims", icon: Receipt, pro: true },
  { href: "/app/paperwork", label: "Paperwork", icon: FileText, pro: true },
];

const initials = (label: string) => (label.toLowerCase() === "you" ? "Me" : label.slice(0, 2));

export function AppShell({ parents, pro, children }: { parents: string[]; pro: boolean; children: React.ReactNode }) {
  const path = usePathname();
  const active = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-[#0b3b32] px-4 py-5 text-white md:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <Mark size={24} light />
          <span className="font-heading text-xl font-bold tracking-[-0.02em]">genora</span>
        </Link>

        <div className="mt-8 flex items-center gap-3 rounded-[12px] bg-white/[0.06] px-3 py-2.5">
          <div className="flex -space-x-2">
            {parents.map((p, i) => (
              <span key={p} className={cn("flex size-8 items-center justify-center rounded-full border-2 border-[#0b3b32] text-[11px] font-bold", i === 0 ? "bg-marigold text-ink" : "bg-[#9cc3e6] text-ink")}>
                {initials(p)}
              </span>
            ))}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Your family</p>
            <p className="text-xs text-white/60">{pro ? "Genora plan" : "Free check"} · 2026</p>
          </div>
        </div>

        <nav aria-label="App" className="mt-6 space-y-1">
          {NAV.map(({ href, label, icon: Icon, pro: needsPro }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium transition-colors",
                active(href) ? "bg-white text-[#0b3b32]" : "text-white/75 hover:bg-white/[0.07] hover:text-white",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              <span className="flex-1">{label}</span>
              {needsPro && !pro && <Lock className="size-3.5 opacity-60" aria-label="Genora plan" />}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          {!pro && (
            <Link href="/pricing" className="block rounded-[12px] bg-marigold px-4 py-3 text-ink">
              <span className="block text-sm font-bold">Unlock the full plan</span>
              <span className="block text-xs text-ink/70">$99 a year for the whole family</span>
            </Link>
          )}
          <Link href="/start" className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm text-white/70 hover:bg-white/[0.07] hover:text-white">
            <Settings2 className="size-[18px]" aria-hidden />
            Edit family details
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[#0b3b32] px-4 text-white md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Mark size={20} light />
            <span className="font-heading text-lg font-bold">genora</span>
          </Link>
          {!pro ? (
            <Link href="/pricing" className="rounded-full bg-marigold px-3 py-1.5 text-xs font-bold text-ink">Unlock</Link>
          ) : (
            <Link href="/start" aria-label="Edit family details" className="p-2 text-white/80"><Settings2 className="size-5" /></Link>
          )}
        </header>

        <main className="flex-1 pb-24 md:pb-10">{children}</main>

        {/* Mobile tab bar */}
        <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-ink/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", active(href) ? "text-pine" : "text-ink/50")}>
              <Icon className="size-5" aria-hidden />
              {label.split(" ")[0]}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

/** Page header used inside the app shell. */
export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-ink/[0.07] px-5 pb-6 pt-7 sm:flex-row sm:items-end sm:justify-between md:px-10 md:pt-10">
      <div>
        <h1 className="font-heading text-[1.9rem] font-bold leading-tight tracking-[-0.025em] text-ink md:text-[2.3rem]">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
