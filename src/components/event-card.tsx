import { CategoryBadge, type Category } from "./category-badge";

export type EventPreview = {
  title: string;
  category: Category;
  date: string;
  place: string;
  fee: string;
  organiser: string;
  verified?: boolean;
};

const banner: Record<Category, string> = {
  competition: "from-cat-competition/25 to-cat-competition/5",
  market: "from-cat-market/25 to-cat-market/5",
  pond: "from-cat-pond/25 to-cat-pond/5",
  community: "from-cat-community/25 to-cat-community/5",
};

export function EventCard({ event }: { event: EventPreview }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`h-28 bg-gradient-to-br ${banner[event.category]}`}
        aria-hidden="true"
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <CategoryBadge category={event.category} />
        <h3 className="font-display text-lg font-semibold leading-snug">
          {event.title}
        </h3>
        <dl className="grid gap-1 text-sm text-muted-foreground">
          <div>
            <dt className="sr-only">Date</dt>
            <dd>{event.date}</dd>
          </div>
          <div>
            <dt className="sr-only">Place</dt>
            <dd>{event.place}</dd>
          </div>
        </dl>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">
            {event.organiser}
            {event.verified && (
              <span className="block font-semibold text-primary">
                ✓ Verified
              </span>
            )}
          </span>
          <span className="whitespace-nowrap font-semibold">{event.fee}</span>
        </div>
      </div>
    </article>
  );
}
