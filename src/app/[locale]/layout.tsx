import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";

import { ThemeScript } from "@/components/theme-script";
import { ThemeSync } from "@/components/theme-switcher";
import { locales } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";
import { env } from "@/lib/env";
import "../globals.css";

const body = Geist({
  variable: "--font-body",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return {
    metadataBase: new URL(env().NEXT_PUBLIC_SITE_URL),
    title: { default: "MyLokalEvent", template: "%s · MyLokalEvent" },
    description: t.meta.description,
  };
}

export default async function RootLayout({
  children,
}: LayoutProps<"/[locale]">) {
  return (
    <html
      lang={await getLocale()}
      className={`${body.variable} ${display.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
