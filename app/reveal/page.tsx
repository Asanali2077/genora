import { redirect } from "next/navigation";

/** The first result moment after onboarding now lives inside the app shell. */
export default function RevealPage() {
  redirect("/app/benefits");
}