"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Lock, Menu, MessageCircleQuestion, Search, Sparkles, X } from "lucide-react";
import { CommandMenu } from "@/components/ui/command-menu";
import { Mark } from "@/components/brand/mark";
import { ALL_ITEMS, ASK, HOME, MOBILE_TABS, NAV_GROUPS, findNav, isActive, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";

const initials = (label: string) => (label.toLowerCase() === "you" ? "Me" : label.slice(0, 2));

/** The one content frame every app screen sits in: same width, same gutters, centred. */
export const FRAME = "mx-auto w-full max-w-[1160px] px-5 md:px-10";

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
        "relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[15px] transition-colors",
        on ? "bg-brand-soft font-semibold text-brand" : "font-medium text-ink/70 hover:bg-wash hover:text-ink",
      )}
    >
      {on && <motion.span layoutId="side-active" className="absolute inset-y-2 -left-3 w-[3px] rounded-r-full bg-brand" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
      <Icon className="size-[18px] shrink-0" aria-hidden />
      <span className="flex-1 truncate">{item.label}</span>
      {item.pro && !pro && <Lock className="size-3.5 text-ink/35" aria-label="Genora plan" />}
    </Link>
  );
}

function Family({ parents, name, pro }: { parents: string[]; name: string; pro: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex -space-x-2">
        {parents.map((p, i) => (
          <span key={p} className={cn("flex size-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold", i === 0 ? "bg-brand text-white" : "bg-sun text-ink")}>{initials(p)}</span>
        ))}
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-sm font-semibold text-ink">{name}</span>
        <span className="block text-xs text-muted-foreground">{pro ? "Genora plan" : "Free check"}</span>
      </span>
    </span>
  );
}

/** Navigation grouped by the questions a parent asks; shared by the sidebar and the mobile menu. */
function NavBody({ path, pro, onNavigate }: { path: string; pro: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="App" className="space-y-6">
      <SideLink item={HOME} path={path} pro={pro} onClick={onNavigate} />
      {NAV_GROUPS.map((g) => (
        <div key={g.id} role="group" aria-labelledby={`nav-${g.id}`}>
          <p id={`nav-${g.id}`} className="px-3 pb-1.5 text-xs font-semibold text-ink/45">{g.label}</p>
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
    <Link href="/pricing" className="group block rounded-[14px] bg-brand-deep p-4 text-white">
      <span className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-sun" aria-hidden />Unlock the full plan</span>
      <span className="mt-1 block text-xs text-white/70">School breaks, claims and letters. $99 a year for the whole family.</span>
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
    <div className="flex min-h-dvh bg-paper">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-line bg-white px-4 py-5 print:hidden md:flex">
        <Link href="/app" className="flex items-center gap-2.5 px-2">
          <Mark size={24} />
          <span className="display text-lg text-ink">genora</span>
        </Link>

        <Link href="/app/family" className="mt-6 flex items-center justify-between rounded-[12px] border border-line px-3 py-2.5 transition-colors hover:bg-wash">
          <Family parents={parents} name={name} pro={pro} />
          <ChevronRight className="size-4 shrink-0 text-ink/30" aria-hidden />
        </Link>

        <button type="button" onClick={() => setCmd(true)} className="mt-3 flex h-10 w-full items-center gap-3 rounded-[10px] bg-wash px-3 text-sm text-muted-foreground transition-colors hover:text-ink">
          <Search className="size-4" aria-hidden />
          <span className="flex-1 text-left">Search or ask…</span>
          <kbd className="rounded-md border border-line bg-white px-1.5 text-[11px] font-semibold">/</kbd>
        </button>

        <div className="-mx-1 mt-6 flex-1 overflow-y-auto px-1">
          <NavBody path={path} pro={pro} />
        </div>

        <div className="mt-4 space-y-3">
          <Link
            href={ASK.href}
            aria-current={isActive(path, ASK.href) ? "page" : undefined}
            className={cn("flex h-11 items-center gap-3 rounded-[10px] border px-3 text-[15px] font-semibold transition-colors", isActive(path, ASK.href) ? "border-brand bg-brand-soft text-brand" : "border-line text-ink hover:border-brand/40 hover:text-brand")}
          >
            <MessageCircleQuestion className="size-[18px]" aria-hidden />
            Ask Genora
          </Link>
          {!pro && <PlanCard />}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 px-2 pl-4 backdrop-blur print:hidden md:hidden">
          <Link href="/app" className="flex items-center gap-2">
            <Mark size={20} />
            <span className="display text-base text-ink">genora</span>
          </Link>
          <span className="flex items-center">
            <button type="button" onClick={() => setCmd(true)} aria-label="Search or ask" className="flex size-11 items-center justify-center text-ink/70"><Search className="size-5" /></button>
            <Link href={ASK.href} aria-label="Ask Genora" className="flex size-11 items-center justify-center text-ink/70"><MessageCircleQuestion className="size-5" /></Link>
            <Link href="/app/sos" className="ml-1 rounded-full bg-sun px-3 py-1.5 text-xs font-bold text-ink">Kid sick?</Link>
          </span>
        </header>

        <div className={cn(FRAME, "flex-1 pb-28 pt-6 md:pb-16 md:pt-10")}>{children}</div>
        <CommandMenu open={cmd} setOpen={setCmd} />

        {/* Mobile tab bar */}
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden md:hidden">
          {MOBILE_TABS.map((href) => {
            const item = ALL_ITEMS.find((i) => i.href === href)!;
            const Icon = item.icon;
            const on = isActive(path, href);
            return (
              <Link key={href} href={href} prefetch aria-current={on ? "page" : undefined} className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", on ? "text-brand" : "text-ink/50")}>
                {on && <motion.span layoutId="tab-dot" className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" />}
                <Icon className="size-5" aria-hidden />
                {item.short}
              </Link>
            );
          })}
          <button type="button" onClick={() => setMenu(true)} aria-expanded={menu} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", !MOBILE_TABS.some((h) => isActive(path, h)) ? "text-brand" : "text-ink/50")}>
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
                className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[24px] bg-white px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/15" aria-hidden />
                <div className="mb-4 flex items-center justify-between">
                  <Family parents={parents} name={name} pro={pro} />
                  <button type="button" onClick={() => setMenu(false)} aria-label="Close menu" className="flex size-11 items-center justify-center rounded-full text-ink/60 hover:bg-wash"><X className="size-5" /></button>
                </div>
                <NavBody path={path} pro={pro} onNavigate={() => setMenu(false)} />
                <div className="mt-5 space-y-3">
                  <Link href={ASK.href} onClick={() => setMenu(false)} className="flex h-11 items-center gap-3 rounded-[10px] border border-line px-3 font-semibold text-ink"><MessageCircleQuestion className="size-[18px]" />Ask Genora</Link>
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

/** Page header: where you are, what this screen answers, and its one main action. */
export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  const path = usePathname();
  const here = findNav(path);
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {here?.group && <Crumb group={here.group.label} />}
        <h1 className="display text-[1.7rem] leading-tight text-ink md:text-[2.1rem]">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:text-base">{sub}</p>}
      </div>
      {action}
    </header>
  );
}

export function Crumb({ group }: { group: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2.5 flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/app" className="hover:text-brand">Today</Link>
      <ChevronRight className="size-3.5" aria-hidden />
      <span>{group}</span>
    </nav>
  );
}
