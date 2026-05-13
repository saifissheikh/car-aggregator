import { prisma } from "@/lib/db";
import { SORT_OPTIONS, type SortValue } from "./components/sort-options";
import { MakeFilter } from "./components/MakeFilter";
import { ModelFilter } from "./components/ModelFilter";
import { SortControl } from "./components/SortControl";
import { Pagination } from "./components/Pagination";
import { ListingCard } from "./components/ListingCard";
import { EmptyState } from "./components/EmptyState";
import { ModeToggle } from "@/components/mode-toggle";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PER_PAGE = 5;

// "Newest" sorts by sourceUpdatedAt — for QS this is the real createdAt; for QL
// it's either styleGenerated (rare, only promoted ads) or a synthesized batch
// timestamp written by the scraper that preserves API-side recency ordering.
const SORT_TO_ORDER: Record<SortValue, Prisma.ListingOrderByWithRelationInput[]> = {
  newest: [{ sourceUpdatedAt: { sort: "desc", nulls: "last" } }, { sourceAdIdNum: { sort: "desc", nulls: "last" } }],
  oldest: [{ sourceUpdatedAt: { sort: "asc", nulls: "last" } }, { sourceAdIdNum: { sort: "asc", nulls: "last" } }],
  price_asc: [{ priceQAR: { sort: "asc", nulls: "last" } }],
  price_desc: [{ priceQAR: { sort: "desc", nulls: "last" } }],
  mileage_asc: [{ mileageKM: { sort: "asc", nulls: "last" } }],
  year_desc: [{ year: { sort: "desc", nulls: "last" } }],
};

function isSortValue(v: string | undefined): v is SortValue {
  return !!v && SORT_OPTIONS.some((o) => o.value === v);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; make?: string; model?: string }>;
}) {
  const sp = await searchParams;
  const sort: SortValue = isSortValue(sp.sort) ? sp.sort : "newest";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const make = sp.make?.trim() || null;
  const model = sp.model?.trim() || null;

  const where: Prisma.ListingWhereInput = {
    isActive: true,
    ...(make ? { make: { equals: make, mode: "insensitive" } } : {}),
    ...(model ? { model: { equals: model, mode: "insensitive" } } : {}),
  };

  const [total, totalAll, listings, makeRows, modelRows] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.count({ where: { isActive: true } }),
    prisma.listing.findMany({
      where,
      orderBy: SORT_TO_ORDER[sort],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.listing.findMany({
      where: { isActive: true, make: { not: null } },
      distinct: ["make"],
      select: { make: true },
      orderBy: { make: "asc" },
    }),
    prisma.listing.findMany({
      where: {
        isActive: true,
        model: { not: null },
        ...(make ? { make: { equals: make, mode: "insensitive" } } : {}),
      },
      distinct: ["model"],
      select: { model: true },
      orderBy: { model: "asc" },
    }),
  ]);

  const makes = makeRows
    .map((r) => r.make)
    .filter((m): m is string => !!m && m.trim().length > 0);

  const models = modelRows
    .map((r) => r.model)
    .filter((m): m is string => !!m && m.trim().length > 0);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const buildHref = (p: number) => {
    const q = new URLSearchParams();
    if (sort !== "newest") q.set("sort", sort);
    if (make) q.set("make", make);
    if (model) q.set("model", model);
    if (p !== 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <main className="min-h-screen grain">
      <div className="mx-auto max-w-7xl">
        <header className="px-5 sm:px-8 lg:px-12 pt-6 sm:pt-14 lg:pt-20 pb-4 sm:pb-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="label">Doha — Live feed</p>
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight mt-1">
                Qatar <span className="italic text-brand">Cars</span>
              </h1>
              <p className="hidden sm:block text-sm sm:text-base text-ink-muted mt-4 max-w-lg leading-relaxed">
                A quiet, mobile-first feed of recently listed cars across Qatar Living and Qatar Sale.
              </p>
              <p className="sm:hidden text-xs font-mono text-ink-muted-2 mt-2 uppercase tracking-wider">
                {totalAll} listings tracked
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:block text-right">
                <p className="font-display text-2xl sm:text-3xl leading-none">{totalAll}</p>
                <p className="label mt-1">Listings tracked</p>
              </div>
              <ModeToggle />
            </div>
          </div>
        </header>

        <div className="sticky top-0 z-20 bg-bone/85 backdrop-blur-md border-y border-ink/10">
          <div className="px-5 sm:px-8 lg:px-12 py-2.5 sm:py-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="text-sm min-w-0 truncate">
              <span className="font-display text-base mr-1">
                {(safePage - 1) * PER_PAGE + 1}–
                {Math.min(safePage * PER_PAGE, total)}
              </span>
              <span className="text-ink-muted">of {total}</span>
            </p>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-stretch sm:gap-2 sm:w-auto">
              <MakeFilter value={make} makes={makes} />
              <ModelFilter value={model} models={models} disabled={models.length === 0} />
              <SortControl value={sort} />
            </div>
          </div>
        </div>

        <section className="px-5 sm:px-8 lg:px-12 py-6 sm:py-8">
          {listings.length === 0 ? (
            <EmptyState filtered={!!(make || model)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {listings.map((l, i) => (
                <ListingCard key={l.id} listing={l} index={i} />
              ))}
            </div>
          )}

          <Pagination page={safePage} totalPages={totalPages} buildHref={buildHref} />
        </section>

        <footer className="px-5 sm:px-8 lg:px-12 py-12 text-center border-t border-ink/10">
          <p className="label">End of feed</p>
        </footer>
      </div>
    </main>
  );
}
