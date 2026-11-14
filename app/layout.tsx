import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionProvider } from "@/components/motion";
import { SmoothScroll } from "@/components/landing/effects";

// Unbounded: page titles and money figures. Onest: everything else. Both carry Cyrillic for the Russian pitch.
const display = Unbounded({ variable: "--font-display", subsets: ["latin", "cyrillic"], weight: ["500", "600", "700"] });
const body = Onest({ variable: "--font-body", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
};

export const viewport: Viewport = { themeColor: "#5b4ae6", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <MotionProvider>
        <SmoothScroll />
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
