import { getMessages } from "@/i18n/messages";

export type Category = "competition" | "market" | "pond" | "community";

// Full class names so Tailwind can see them at build time.
const styles: Record<Category, string> = {
  competition: "bg-cat-competition-soft text-cat-competition",
  market: "bg-cat-market-soft text-cat-market",
  pond: "bg-cat-pond-soft text-cat-pond",
  community: "bg-cat-community-soft text-cat-community",
};

export async function CategoryBadge({ category }: { category: Category }) {
  const t = await getMessages();
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[category]}`}
    >
      {t.categories[category]}
    </span>
  );
}
