import { cookies } from "next/headers";
import { LOCALES, appConfig, type Locale } from "@/config/app.config";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("locale")?.value;
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as Locale) : appConfig.defaultLocale;
}
