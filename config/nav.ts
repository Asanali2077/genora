import type { LucideIcon } from "lucide-react";
import {
  CalendarDays, ChartNoAxesCombined, FileText, House, Landmark, LifeBuoy, MessageCircleQuestion, Receipt, Users,
} from "lucide-react";

/**
 * The one map of the app. Sections follow the questions a parent actually asks
 * ("are we okay?", "what about the kids' days off?", "what do I send HR?"), not the engines behind them.
 * The sidebar, the mobile menu, the ⌘K menu, page breadcrumbs and locked previews all read from here.
 */
export type NavItem = {
  href: string;
  label: string;
  short: string; // mobile tab label
  icon: LucideIcon;
  pro: boolean;
  question: string; // the question this screen answers, shown in menus and previews
  keywords: string;
  unlocks?: string[]; // what a locked screen gives, for the preview
};

export type NavGroup = { id: string; label: string; items: NavItem[] };

export const HOME: NavItem = {
  href: "/app", label: "Today", short: "Today", icon: House, pro: false,
  question: "What needs us this week, and are we okay?", keywords: "home dashboard overview next actions",
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "money",
    label: "Money",
    items: [
      { href: "/app/budget", label: "Budget forecast", short: "Budget", icon: ChartNoAxesCombined, pro: false, question: "Will we have enough every month this year?", keywords: "cash flow month forecast bills money rent" },
      { href: "/app/benefits", label: "Taxes & benefits", short: "Benefits", icon: Landmark, pro: false, question: "FSA or tax credit — which split pays us most?", keywords: "fsa credit tax optimizer child tax credit employer" },
      {
        href: "/app/claims", label: "Claims & receipts", short: "Claims", icon: Receipt, pro: true, question: "Are we claiming every FSA dollar before the deadline?", keywords: "receipts fsa reimbursement forfeit upload",
        unlocks: ["Snap a daycare receipt and AI reads it", "A forfeiture alert before money is lost", "Provider list ready for Form 2441"],
      },
    ],
  },
  {
    id: "care",
    label: "Care",
    items: [
      {
        href: "/app/coverage", label: "School breaks", short: "Breaks", icon: CalendarDays, pro: true, question: "Who is with the kids on every day off school?", keywords: "calendar pto camp summer holiday",
        unlocks: ["Paste the district calendar, AI finds every closure", "Both parents' PTO split across the costliest days", "Add the whole plan to Google or Apple Calendar"],
      },
      { href: "/app/sos", label: "Sick day plan", short: "Sick day", icon: LifeBuoy, pro: false, question: "Kid sick tomorrow — what's the cheapest way to cover it?", keywords: "sick closed daycare school emergency sitter backup" },
    ],
  },
  {
    id: "family",
    label: "Family",
    items: [
      { href: "/app/family", label: "Kids & partner", short: "Family", icon: Users, pro: false, question: "Who's in the plan and what changes as the kids grow?", keywords: "kids profile settings partner invite spouse" },
      {
        href: "/app/paperwork", label: "Letters & forms", short: "Letters", icon: FileText, pro: true, question: "What exactly do I send HR and the daycare?", keywords: "letters hr w-10 email election",
        unlocks: ["The FSA election email for HR, filled in", "A W-10 request for every provider", "A mid-year change letter when life changes"],
      },
    ],
  },
];

export const ASK: NavItem = {
  href: "/app/ask", label: "Ask Genora", short: "Ask", icon: MessageCircleQuestion, pro: false,
  question: "Anything about your family's money, answered from your numbers.", keywords: "question chat help ai",
};

export const ALL_ITEMS: NavItem[] = [HOME, ...NAV_GROUPS.flatMap((g) => g.items), ASK];

/** Mobile tab bar: the four screens a parent opens most, plus "Menu" for the rest. */
export const MOBILE_TABS = ["/app", "/app/budget", "/app/benefits", "/app/coverage"];

export function findNav(path: string): { item: NavItem; group?: NavGroup } | undefined {
  for (const g of NAV_GROUPS) for (const i of g.items) if (path === i.href || path.startsWith(`${i.href}/`)) return { item: i, group: g };
  if (path.startsWith(ASK.href)) return { item: ASK };
  if (path === HOME.href) return { item: HOME };
  return undefined;
}

export const isActive = (path: string, href: string) => (href === "/app" ? path === "/app" : path === href || path.startsWith(`${href}/`));
