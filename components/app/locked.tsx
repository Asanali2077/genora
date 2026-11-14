import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";

export function Locked({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
      <Mark size={40} className="shrink-0" />
      <div className="flex-1">
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <p className="mt-1.5 max-w-lg text-muted-foreground">{body}</p>
      </div>
      <Button size="lg" nativeButton={false} render={<Link href="/pricing" />}>See plans</Button>
    </div>
  );
}
