import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  // Show up to 5 page chips around the current page, with ellipses.
  const windowSize = 2;
  const pages: (number | "…")[] = [];
  const start = Math.max(1, page - windowSize);
  const end = Math.min(totalPages, page + windowSize);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("…");
  }
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1.5 sm:gap-2 py-10">
      <ArrowLink href={prev ? buildHref(prev) : null} dir="prev" />

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-1.5 text-ink-muted text-sm select-none">
              …
            </span>
          ) : (
            <PageChip key={p} page={p} active={p === page} href={buildHref(p)} />
          )
        )}
      </div>

      <ArrowLink href={next ? buildHref(next) : null} dir="next" />
    </nav>
  );
}

function PageChip({
  page,
  active,
  href,
}: {
  page: number;
  active: boolean;
  href: string;
}) {
  const base =
    "min-w-[36px] h-9 px-2 inline-flex items-center justify-center rounded-full text-sm font-mono transition";
  if (active) {
    return (
      <span className={`${base} bg-ink text-bone`}>{page}</span>
    );
  }
  return (
    <Link href={href} className={`${base} text-ink hover:bg-ink/5 border border-transparent hover:border-ink/10`}>
      {page}
    </Link>
  );
}

function ArrowLink({ href, dir }: { href: string | null; dir: "prev" | "next" }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  const base =
    "h-9 w-9 inline-flex items-center justify-center rounded-full border transition";
  if (!href) {
    return (
      <span className={`${base} border-ink/5 text-ink-muted-2 cursor-not-allowed`}>
        <Icon size={16} />
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`${base} border-ink/10 text-ink hover:bg-ink hover:text-bone`}
      aria-label={dir === "prev" ? "Previous page" : "Next page"}
    >
      <Icon size={16} />
    </Link>
  );
}
