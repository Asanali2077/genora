"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Camera, CornerDownLeft, FileSearch, LifeBuoy, MessageCircleQuestion, Search, UserPlus, Wallet } from "lucide-react";
import { ALL_ITEMS, findNav } from "@/config/nav";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Item = { id: string; group: "Jump to" | "Do"; label: string; hint?: string; href: string; icon: React.ComponentType<{ className?: string }>; keywords: string };

const DO: Item[] = [
  { id: "sos", group: "Do", label: "My kid is sick tomorrow", hint: "Sick day plan", href: "/app/sos", icon: LifeBuoy, keywords: "sick closed daycare school emergency sitter" },
  { id: "receipt", group: "Do", label: "Add a childcare receipt", href: "/app/claims", icon: Camera, keywords: "photo upload daycare invoice" },
  { id: "bills", group: "Do", label: "Update my monthly bills", href: "/app/budget", icon: Wallet, keywords: "rent mortgage groceries budget edit" },
  { id: "scan", group: "Do", label: "Scan my employer benefits guide", href: "/app/benefits#employer", icon: FileSearch, keywords: "pdf hr backup care" },
  { id: "calendar", group: "Do", label: "Plan the school calendar", href: "/app/coverage", icon: CalendarDays, keywords: "paste district calendar" },
  { id: "invite", group: "Do", label: "Invite my partner", href: "/app/family", icon: UserPlus, keywords: "spouse share" },
];
const ITEMS: Item[] = [
  ...ALL_ITEMS.filter((n) => n.href !== "/app/ask").map((n) => ({ id: n.href, group: "Jump to" as const, label: n.label, hint: findNav(n.href)?.group?.label, href: n.href, icon: n.icon, keywords: `${n.keywords} ${n.question}` })),
  ...DO,
];

/** ⌘K / Ctrl+K command menu: jump anywhere, run common actions, or ask Genora anything. */
export function CommandMenu({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      // ⌘K / Ctrl+K, plus "/" (Ctrl+K is taken by the address bar in some browsers).
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing && !open)) {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? ITEMS.filter((i) => `${i.label} ${i.keywords} ${i.hint ?? ""}`.toLowerCase().includes(s)) : ITEMS;
    const ask: Item[] = s.length > 2 ? [{ id: "ask", group: "Do", label: `Ask Genora: “${q.trim()}”`, href: `/app/ask?q=${encodeURIComponent(q.trim())}`, icon: MessageCircleQuestion, keywords: "" }] : [];
    return [...list, ...ask];
  }, [q]);

  function go(item: Item) {
    track("command_menu", { id: item.id });
    setOpen(false);
    setQ("");
    router.push(item.href);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[12vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            className="w-full max-w-xl overflow-hidden rounded-[18px] border border-ink/10 bg-white shadow-[0_30px_80px_-20px_rgba(34,24,90,0.55)]"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            onAnimationComplete={() => inputRef.current?.focus()}
          >
            <div className="flex items-center gap-3 border-b border-ink/[0.08] px-4">
              <Search className="size-5 text-ink/40" aria-hidden />
              <input
                ref={inputRef}
                autoFocus
                value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
                  if (e.key === "Enter" && results[active]) go(results[active]);
                }}
                placeholder="Search, jump to a section, or ask Genora…"
                aria-label="Search commands"
                aria-controls="cmd-list"
                aria-activedescendant={results[active] ? `cmd-${results[active].id.replace(/\W/g, "")}` : undefined}
                className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/40"
              />
              <kbd className="rounded-md border border-ink/15 px-1.5 py-0.5 text-[11px] font-semibold text-ink/50">Esc</kbd>
            </div>
            <ul id="cmd-list" role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Type a question to ask Genora.</li>}
              {results.map((item, i) => (
                <li key={item.id}>
                  {(i === 0 || results[i - 1].group !== item.group) && <p className="px-3 pb-1 pt-3 text-xs font-semibold text-ink/45">{item.group}</p>}
                  <button
                    id={`cmd-${item.id.replace(/\W/g, "")}`}
                    role="option"
                    aria-selected={i === active}
                    type="button"
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(item)}
                    className={cn("relative flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[15px] text-ink", i === active && "text-brand")}
                  >
                    {i === active && <motion.span layoutId="cmd-active" className="absolute inset-0 rounded-[10px] bg-brand/[0.08]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                    <item.icon className="relative size-[18px] shrink-0" />
                    <span className="relative flex-1">{item.label}</span>
                    {item.hint && <span className="relative text-xs text-muted-foreground">{item.hint}</span>}
                    {i === active && <CornerDownLeft className="relative size-4 text-brand" aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
