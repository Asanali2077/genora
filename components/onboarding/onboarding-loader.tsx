"use client";

import dynamic from "next/dynamic";

// Client-only: the draft is restored from localStorage on first render.
const Onboarding = dynamic(() => import("./onboarding").then((m) => m.Onboarding), { ssr: false });

export function OnboardingLoader() {
  return <Onboarding />;
}
