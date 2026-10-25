import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return pageMetadata("/privacy", t.privacy.title);
}

const sections = ["collect", "why", "where", "rights"] as const;

// Draft written for PDPA readiness. Have it reviewed before public launch.
export default async function PrivacyPage() {
  const t = await getMessages();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <p className="inline-block rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
          {t.privacy.draft}
        </p>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
          {t.privacy.title}
        </h1>
        <div className="mt-6 flex flex-col gap-6 leading-relaxed">
          {sections.map((section) => (
            <section key={section}>
              <h2 className="font-display text-xl font-bold">
                {t.privacy[`${section}Heading`]}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t.privacy[`${section}Body`]}
              </p>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
