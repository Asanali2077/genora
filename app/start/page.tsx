import type { Metadata } from "next";
import { OnboardingLoader } from "@/components/onboarding/onboarding-loader";

export const metadata: Metadata = { title: "Build your plan — Genora" };

export default function StartPage() {
  return <OnboardingLoader />;
}
