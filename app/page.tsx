import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { SORT_OPTIONS, type SortValue } from "./components/sort-options";
import { MakeFilter } from "./components/MakeFilter";
import { ModelFilter } from "./components/ModelFilter";
import { SortControl } from "./components/SortControl";
import { SearchInput } from "./components/SearchInput";
import { ListingsSection } from "./components/ListingsSection";
import { ListingsSkeleton } from "./components/ListingsSkeleton";
import { ModeToggle } from "@/components/mode-toggle";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PER_PAGE = 10;

function isSortValue(v: string | undefined): v is SortValue {
  return !!v && SORT_OPTIONS.some((o) => o.value === v);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; make?: string; model?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const sort: SortValue = isSortValue(sp.sort) ? sp.sort : "newest";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const make = sp.make?.trim() || null;
  const model = sp.model?.trim() || null;
  const q = sp.q?.trim() || null;

  // Free-text search across the fields most useful for finding a car: make, model,
  // trim, title (often holds variant + descriptor), body type, exterior color, fuel,
  // location, dealer name, and the descriptive blob. Year is matched too if the
  // query parses as a 4-digit number.
  const qYear = q && /^\d{4}$/.test(q) ? parseInt(q, 10) : null;
  const searchFilter: Prisma.ListingWhereInput | null = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { make: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
          { trim: { contains: q, mode: "insensitive" } },
          { bodyType: { contains: q, mode: "insensitive" } },
          { exteriorColor: { contains: q, mode: "insensitive" } },
          { fuelType: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
          { dealerName: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          ...(qYear ? [{ year: qYear } as Prisma.ListingWhereInput] : []),
        ],
      }
    : null;

  const where: Prisma.ListingWhereInput = {
    isActive: true,
    ...(make ? { make: { equals: make, mode: "insensitive" } } : {}),
    ...(model ? { model: { equals: model, mode: "insensitive" } } : {}),
    ...(searchFilter ?? {}),
  };

  // These queries don't depend on the search/filter state, so they live outside
  // the Suspense boundary — the filter bar stays stable while the listings reload.
  const [totalAll, makeRows, modelRows] = await Promise.all([
    prisma.listing.count({ where: { isActive: true } }),
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

  const buildHref = (p: number) => {
    const qs = new URLSearchParams();
    if (sort !== "newest") qs.set("sort", sort);
    if (make) qs.set("make", make);
    if (model) qs.set("model", model);
    if (q) qs.set("q", q);
    if (p !== 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/?${s}` : "/";
  };

  // Suspense key forces the boundary to re-fire (and show the skeleton) whenever
  // any filter changes, instead of holding the stale list during the server roundtrip.
  const suspenseKey = `${q ?? ""}|${make ?? ""}|${model ?? ""}|${sort}|${page}`;

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
          <div className="px-5 sm:px-8 lg:px-12 py-2.5 sm:py-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
            <div className="sm:flex-1 sm:max-w-md">
              <SearchInput value={q} />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-stretch sm:gap-2 sm:ml-auto">
              <MakeFilter value={make} makes={makes} />
              <ModelFilter value={model} models={models} disabled={models.length === 0} />
              <SortControl value={sort} />
            </div>
          </div>
        </div>

        <Suspense key={suspenseKey} fallback={<ListingsSkeleton perPage={PER_PAGE} />}>
          <ListingsSection
            where={where}
            sort={sort}
            page={page}
            perPage={PER_PAGE}
            filtered={!!(make || model || q)}
            buildHref={buildHref}
          />
        </Suspense>

        <footer className="px-5 sm:px-8 lg:px-12 py-12 text-center border-t border-ink/10">
          <p className="label">End of feed</p>
        </footer>
      </div>
    </main>
  );
}
