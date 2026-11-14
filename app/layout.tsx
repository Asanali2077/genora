import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk, Figtree } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionProvider } from "@/components/motion";
import { SmoothScroll } from "@/components/landing/effects";

const display = Familjen_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Figtree({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
};

export const viewport: Viewport = { themeColor: "#0f5c4d", width: "device-width", initialScale: 1 };

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
