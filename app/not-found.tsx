import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">There&apos;s no page here</h1>
      <p className="text-muted-foreground">Start from the home page to build your family&apos;s plan.</p>
      <Button className="tap" nativeButton={false} render={<Link href="/" />}>Go to home</Button>
    </div>
  );
}
