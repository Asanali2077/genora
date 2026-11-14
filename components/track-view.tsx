"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Logs a funnel event once when a server-rendered page is shown. */
export function TrackView({ name, props }: { name: string; props?: Record<string, unknown> }) {
  useEffect(() => {
    track(name, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
  return null;
}
