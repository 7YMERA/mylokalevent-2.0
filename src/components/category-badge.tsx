export type Category = "competition" | "market" | "pond" | "community";

export const categoryLabels: Record<Category, string> = {
  competition: "Fishing competition",
  market: "Coastal market",
  pond: "Kolam pancing",
  community: "Community",
};

// Full class names so Tailwind can see them at build time.
const styles: Record<Category, string> = {
  competition: "bg-cat-competition-soft text-cat-competition",
  market: "bg-cat-market-soft text-cat-market",
  pond: "bg-cat-pond-soft text-cat-pond",
  community: "bg-cat-community-soft text-cat-community",
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[category]}`}
    >
      {categoryLabels[category]}
    </span>
  );
}
