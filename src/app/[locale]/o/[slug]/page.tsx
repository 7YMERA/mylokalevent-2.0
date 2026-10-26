import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FollowButton } from "@/components/follow-button";
import { SiteHeader } from "@/components/site-header";
import { getLocale, getMessages } from "@/i18n/messages";
import { getCurrentUser } from "@/lib/auth";
import { isFollowingOrganiser } from "@/lib/engagement";
import { getVerifiedOrganiser } from "@/lib/organisers";

type Params = { params: Promise<{ slug: string }> };

// DB-backed per-slug page: metadata reads the organiser row (runtime data),
// so this route is dynamic, not statically prerendered.
export const instant = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const [organiser, t] = await Promise.all([
    getVerifiedOrganiser(slug),
    getMessages(),
  ]);
  if (!organiser) {
    return { title: t.organiser.notFound, robots: { index: false } };
  }
  return {
    title: organiser.name,
    description: t.organiser.verifiedBadge,
    openGraph: { title: organiser.name, type: "profile" },
  };
}

// A small stroke-only badge (no emoji), matching the professional icon style.
function VerifiedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-3 py-1 text-sm font-semibold text-success">
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2 4 5v6c0 5 3.4 8.3 8 10 4.6-1.7 8-5 8-10V5l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      {label}
    </span>
  );
}

async function OrganiserBody({ slug }: { slug: string }) {
  const [organiser, t, locale, user] = await Promise.all([
    getVerifiedOrganiser(slug),
    getMessages(),
    getLocale(),
    getCurrentUser(),
  ]);

  if (!organiser) notFound();

  const following = user ? await isFollowingOrganiser(organiser.id) : false;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {organiser.name}
          </h1>
          <VerifiedBadge label={t.organiser.verifiedBadge} />
          <FollowButton
            organiserId={organiser.id}
            initialFollowing={following}
            signedIn={Boolean(user)}
            locale={locale}
            labels={{
              follow: t.engagement.follow,
              following: t.engagement.following,
              signIn: t.engagement.signInToSave,
            }}
          />
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {organiser.state ? (
            <div>
              <dt className="text-sm text-muted-foreground">
                {t.organiser.state}
              </dt>
              <dd className="mt-1 font-semibold">{organiser.state}</dd>
            </div>
          ) : null}
          {organiser.phone ? (
            <div>
              <dt className="text-sm text-muted-foreground">
                {t.organiser.contact}
              </dt>
              <dd className="mt-1 font-semibold break-all">
                {organiser.phone}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold tracking-tight">
          {t.organiser.eventsHeading}
        </h2>
        {/* Events arrive in task 3. Until then the list is empty. */}
        <p className="mt-4 rounded-3xl border border-dashed border-border bg-surface-muted p-8 text-center text-muted-foreground">
          {t.organiser.noEvents}
        </p>
      </section>
    </main>
  );
}

export default async function OrganiserPage({ params }: Params) {
  const { slug } = await params;
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<div className="flex-1" />}>
        <OrganiserBody slug={slug} />
      </Suspense>
    </>
  );
}
