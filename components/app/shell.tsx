"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Lock, Menu, MessageCircleQuestion, Search, X } from "lucide-react";
import { CommandMenu } from "@/components/ui/command-menu";
import { Mark } from "@/components/brand/mark";
import { ALL_ITEMS, ASK, HOME, MOBILE_TABS, NAV_GROUPS, findNav, isActive, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";

const initials = (label: string) => (label.toLowerCase() === "you" ? "Me" : label.slice(0, 2));

function SideLink({ item, path, pro, onClick }: { item: NavItem; path: string; pro: boolean; onClick?: () => void }) {
  const on = isActive(path, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch
      onClick={onClick}
      aria-current={on ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium transition-colors",
        on ? "bg-white text-[#0b3b32]" : "text-white/75 hover:bg-white/[0.07] hover:text-white",
      )}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden />
      <span className="flex-1 truncate">{item.label}</span>
      {item.pro && !pro && <Lock className="size-3.5 opacity-50" aria-label="Genora plan" />}
    </Link>
  );
}

function Family({ parents, name, pro }: { parents: string[]; name: string; pro: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex -space-x-2">
        {parents.map((p, i) => (
          <span key={p} className={cn("flex size-8 items-center justify-center rounded-full border-2 border-[#0b3b32] text-[11px] font-bold text-ink", i === 0 ? "bg-marigold" : "bg-[#9cc3e6]")}>{initials(p)}</span>
        ))}
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-sm font-semibold">{name}</span>
        <span className="block text-xs text-white/60">{pro ? "Genora plan" : "Free check"}</span>
      </span>
    </span>
  );
}

/** Navigation grouped by the questions a parent asks; shared by the sidebar and the mobile menu. */
function NavBody({ path, pro, onNavigate }: { path: string; pro: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="App" className="space-y-5">
      <SideLink item={HOME} path={path} pro={pro} onClick={onNavigate} />
      {NAV_GROUPS.map((g) => (
        <div key={g.id} role="group" aria-labelledby={`nav-${g.id}`}>
          <p id={`nav-${g.id}`} className="px-3 pb-1.5 text-xs font-semibold text-white/45">{g.label}</p>
          <div className="space-y-0.5">
            {g.items.map((i) => <SideLink key={i.href} item={i} path={path} pro={pro} onClick={onNavigate} />)}
          </div>
        </div>
      ))}
    </nav>
  );
}

function PlanCard() {
  return (
    <Link href="/pricing" className="block rounded-[12px] border border-marigold/40 bg-marigold/[0.12] px-4 py-3 text-white transition-colors hover:bg-marigold/20">
      <span className="block text-sm font-bold text-marigold">Unlock the full plan</span>
      <span className="block text-xs text-white/70">$99 a year for the whole family</span>
    </Link>
  );
}

export function AppShell({ parents, name, pro, children }: { parents: string[]; name: string; pro: boolean; children: React.ReactNode }) {
  const path = usePathname();
  const [cmd, setCmd] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-[#0b3b32] px-4 py-5 text-white print:hidden md:flex">
        <Link href="/app" className="flex items-center gap-2.5 px-2">
          <Mark size={24} light />
          <span className="font-heading text-xl font-bold tracking-[-0.02em]">genora</span>
        </Link>

        <Link href="/app/family" className="mt-6 flex items-center justify-between rounded-[12px] bg-white/[0.06] px-3 py-2.5 hover:bg-white/[0.1]">
          <Family parents={parents} name={name} pro={pro} />
          <ChevronRight className="size-4 text-white/40" aria-hidden />
        </Link>

        <button type="button" onClick={() => setCmd(true)} className="mt-3 flex h-10 w-full items-center gap-3 rounded-[10px] border border-white/10 bg-white/[0.04] px-3 text-sm text-white/60 transition-colors hover:border-white/25 hover:text-white">
          <Search className="size-4" aria-hidden />
          <span className="flex-1 text-left">Search or ask…</span>
          <kbd className="rounded border border-white/20 px-1.5 text-[11px] font-semibold">/</kbd>
        </button>

        <div className="-mx-1 mt-5 flex-1 overflow-y-auto px-1">
          <NavBody path={path} pro={pro} />
        </div>

        <div className="mt-4 space-y-3">
          <Link
            href={ASK.href}
            aria-current={isActive(path, ASK.href) ? "page" : undefined}
            className={cn("flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-semibold transition-colors", isActive(path, ASK.href) ? "bg-white text-[#0b3b32]" : "bg-white/[0.08] text-white hover:bg-white/[0.14]")}
          >
            <MessageCircleQuestion className="size-[18px]" aria-hidden />
            Ask Genora
          </Link>
          {!pro && <PlanCard />}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[#0b3b32] px-2 pl-4 text-white print:hidden md:hidden">
          <Link href="/app" className="flex items-center gap-2">
            <Mark size={20} light />
            <span className="font-heading text-lg font-bold">genora</span>
          </Link>
          <span className="flex items-center">
            <button type="button" onClick={() => setCmd(true)} aria-label="Search or ask" className="flex size-11 items-center justify-center text-white/85"><Search className="size-5" /></button>
            <Link href={ASK.href} aria-label="Ask Genora" className="flex size-11 items-center justify-center text-white/85"><MessageCircleQuestion className="size-5" /></Link>
            <Link href="/app/sos" className="ml-1 rounded-full bg-marigold px-3 py-1.5 text-xs font-bold text-ink">Kid sick?</Link>
          </span>
        </header>

        <div className="flex-1 pb-24 md:pb-10">{children}</div>
        <CommandMenu open={cmd} setOpen={setCmd} />

        {/* Mobile tab bar */}
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-ink/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden md:hidden">
          {MOBILE_TABS.map((href) => {
            const item = ALL_ITEMS.find((i) => i.href === href)!;
            const Icon = item.icon;
            const on = isActive(path, href);
            return (
              <Link key={href} href={href} prefetch aria-current={on ? "page" : undefined} className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", on ? "text-pine" : "text-ink/50")}>
                {on && <motion.span layoutId="tab-dot" className="absolute top-0 h-0.5 w-8 rounded-full bg-pine" />}
                <Icon className="size-5" aria-hidden />
                {item.short}
              </Link>
            );
          })}
          <button type="button" onClick={() => setMenu(true)} aria-expanded={menu} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", !MOBILE_TABS.some((h) => isActive(path, h)) ? "text-pine" : "text-ink/50")}>
            <Menu className="size-5" aria-hidden />
            Menu
          </button>
        </nav>

        {/* Mobile menu sheet */}
        <AnimatePresence>
          {menu && (
            <motion.div className="fixed inset-0 z-40 bg-ink/40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)}>
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[24px] bg-[#0b3b32] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 text-white"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" aria-hidden />
                <div className="mb-4 flex items-center justify-between">
                  <Family parents={parents} name={name} pro={pro} />
                  <button type="button" onClick={() => setMenu(false)} aria-label="Close menu" className="flex size-11 items-center justify-center rounded-full text-white/70 hover:bg-white/10"><X className="size-5" /></button>
                </div>
                <NavBody path={path} pro={pro} onNavigate={() => setMenu(false)} />
                <div className="mt-5 space-y-3">
                  <Link href={ASK.href} onClick={() => setMenu(false)} className="flex h-11 items-center gap-3 rounded-[10px] bg-white/[0.08] px-3 font-semibold"><MessageCircleQuestion className="size-[18px]" />Ask Genora</Link>
                  {!pro && <PlanCard />}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Page header: where you are (section), what this screen answers, and its one main action. */
export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  const path = usePathname();
  const here = findNav(path);
  return (
    <div className="flex flex-col gap-4 border-b border-ink/[0.07] px-5 pb-6 pt-6 sm:flex-row sm:items-end sm:justify-between md:px-10 md:pt-9">
      <div>
        {here?.group && (
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/app" className="hover:text-pine">Today</Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span>{here.group.label}</span>
          </nav>
        )}
        <h1 className="font-heading text-[1.9rem] font-bold leading-tight tracking-[-0.025em] text-ink md:text-[2.3rem]">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
