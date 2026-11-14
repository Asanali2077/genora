import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Locked({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-pine/30 bg-card p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-lg text-muted-foreground">{body}</p>
      <Button className="tap mt-5 h-11 px-5" nativeButton={false} render={<Link href="/pricing" />}>See plans</Button>
    </div>
  );
}
