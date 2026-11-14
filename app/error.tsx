"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-1 flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">This page didn&apos;t load</h1>
      <p className="text-muted-foreground">Your data is safe. Reload the page to try again.</p>
      <Button className="tap" onClick={reset}>Reload</Button>
    </div>
  );
}
