import Link from "next/link";
import { Check } from "lucide-react";
import { Mark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { ALL_ITEMS } from "@/config/nav";

/** A paid screen for a free family: what it answers and what it unlocks, never a dead end. */
export function Locked({ title, body, href }: { title: string; body: string; href?: string }) {
  const item = href ? ALL_ITEMS.find((i) => i.href === href) : undefined;
  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:p-7">
        <Mark size={40} className="shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <p className="mt-1.5 max-w-lg text-muted-foreground">{body}</p>
          {item?.unlocks && (
            <ul className="mt-5 space-y-2.5">
              {item.unlocks.map((u) => (
                <li key={u} className="flex items-start gap-2.5 text-[15px] text-ink">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><Check className="size-3.5" aria-hidden /></span>
                  {u}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-ink/[0.07] bg-wash px-6 py-4 sm:px-7">
        <Button size="lg" nativeButton={false} render={<Link href="/pricing" />}>Unlock for $99 a year</Button>
        <Link href="/app" className="text-sm font-semibold text-brand hover:underline">Back to Today</Link>
        <span className="text-sm text-muted-foreground sm:ml-auto">One plan covers both parents.</span>
      </div>
    </div>
  );
}
