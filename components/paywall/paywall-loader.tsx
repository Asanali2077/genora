"use client";

import dynamic from "next/dynamic";

// ssr:false — таймер и вариант A/B читают localStorage/URL.
const PaywallView = dynamic(() => import("./paywall-view"), { ssr: false });

export function PaywallLoader() {
  return <PaywallView />;
}
