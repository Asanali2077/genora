import type { Metadata, Viewport } from "next";
import { Unbounded, Onest } from "next/font/google";
import "./globals.css";
import { appConfig } from "@/config/app.config";
import { LocaleProvider } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { SiteHeader } from "@/components/site-header";

const display = Unbounded({ variable: "--font-display", subsets: ["latin", "cyrillic"], weight: ["500", "700", "800"] });
const body = Onest({ variable: "--font-body", subsets: ["latin", "cyrillic"] });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: `${appConfig.brand.name} — ${appConfig.brand.tagline[locale]}`,
    description: appConfig.brand.description[locale],
  };
}

export const viewport: Viewport = { themeColor: "#0b1a1c", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`dark ${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LocaleProvider initial={locale}>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
