import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Privacy notice · MyLokalEvent" };

// Draft written for PDPA readiness. Have it reviewed before public launch.
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <p className="inline-block rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
          Draft, to be reviewed before launch
        </p>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
          Privacy notice
        </h1>
        <div className="mt-6 flex flex-col gap-6 leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-bold">What we collect</h2>
            <p className="mt-2 text-muted-foreground">
              Your name, email address and password (stored only as a secure
              hash) when you create an account, plus the events you save and the
              organisers you follow. Organisers also give a contact number and,
              optionally, an SSM registration number.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold">Why</h2>
            <p className="mt-2 text-muted-foreground">
              To run your account, show and remind you about events, verify
              organisers, and process payments. We do not sell your data.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold">
              Where it&apos;s kept
            </h2>
            <p className="mt-2 text-muted-foreground">
              On Supabase servers in Singapore. Access is restricted so each
              user can only see their own personal data.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold">Your rights</h2>
            <p className="mt-2 text-muted-foreground">
              Under Malaysia&apos;s Personal Data Protection Act 2010 you can
              ask to see, correct or delete your data, and withdraw consent at
              any time by closing your account.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
