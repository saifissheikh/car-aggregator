import Link from "next/link";
import { Sparkles, MapPin, Gauge, Fuel, Calendar } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatQAR, formatKM, formatRelative } from "@/lib/utils";
import { SortControl } from "./components/SortControl";
import { SORT_OPTIONS, type SortValue } from "./components/sort-options";
import { MakeFilter } from "./components/MakeFilter";
import { Pagination } from "./components/Pagination";
import { CardCarousel } from "./components/CardCarousel";
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
  searchParams: Promise<{ page?: string; sort?: string; make?: string }>;
}) {
  const sp = await searchParams;
  const sort: SortValue = isSortValue(sp.sort) ? sp.sort : "newest";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const make = sp.make?.trim() || null;

  const where: Prisma.ListingWhereInput = {
    isActive: true,
    ...(make ? { make: { equals: make, mode: "insensitive" } } : {}),
  };

  const [total, listings, makeRows] = await Promise.all([
    prisma.listing.count({ where }),
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
  ]);

  const makes = makeRows
    .map((r) => r.make)
    .filter((m): m is string => !!m && m.trim().length > 0);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const buildHref = (p: number) => {
    const q = new URLSearchParams();
    if (sort !== "newest") q.set("sort", sort);
    if (make) q.set("make", make);
    if (p !== 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <main className="min-h-screen grain">
      <div className="mx-auto max-w-7xl">
        <header className="px-5 sm:px-8 lg:px-12 pt-10 sm:pt-14 lg:pt-20 pb-6 sm:pb-10">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="label">Doha — Live feed</p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight mt-1">
                Qatar <span className="italic text-brand">Cars</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-display text-2xl sm:text-3xl leading-none">{total}</p>
                <p className="label mt-1">Listings tracked</p>
              </div>
              <ModeToggle />
            </div>
          </div>
          <p className="text-sm sm:text-base text-ink-muted mt-4 max-w-lg leading-relaxed">
            A quiet, mobile-first feed of recently listed cars across Qatar Living and Qatar Sale.
          </p>
        </header>

        <div className="sticky top-0 z-20 bg-bone/80 backdrop-blur-md border-y border-ink/10">
          <div className="px-5 sm:px-8 lg:px-12 py-3 flex items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-display text-base mr-1">
                {(safePage - 1) * PER_PAGE + 1}–
                {Math.min(safePage * PER_PAGE, total)}
              </span>
              <span className="text-ink-muted">of {total}</span>
            </p>
            <div className="flex items-center gap-2">
              <MakeFilter value={make} makes={makes} />
              <SortControl value={sort} />
            </div>
          </div>
        </div>

        <section className="px-5 sm:px-8 lg:px-12 py-6 sm:py-8">
          {listings.length === 0 ? (
            <EmptyState />
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

function ListingCard({
  listing: l,
  index,
}: {
  listing: Awaited<ReturnType<typeof prisma.listing.findMany>>[number];
  index: number;
}) {
  const images = (l.images as string[]) ?? [];
  const isFresh =
    Date.now() - new Date(l.firstSeenAt).getTime() < 24 * 60 * 60 * 1000;
  const features = (l.features as string[]) ?? [];

  return (
    <Link
      href={`/listing/${l.id}`}
      className="block group animate-fadeUp"
      style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
    >
      <article className="bg-paper rounded-2xl overflow-hidden border border-ink/5 shadow-soft md:hover:shadow-lift md:hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
        {images.length > 0 ? (
          <CardCarousel
            images={images}
            alt={`${l.make ?? ""} ${l.model ?? ""}`.trim() || "Car"}
            priority={index < 4}
            overlay={
              <>
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
                  {isFresh && (
                    <span className="chip bg-brand/95 text-bone border-transparent">
                      <Sparkles size={10} /> Just added
                    </span>
                  )}
                  {l.isBrandNew && (
                    <span className="chip bg-ink text-bone border-transparent">New</span>
                  )}
                </div>
                <span className="absolute top-3 right-3 chip z-10">
                  {l.source === "qatarliving" ? "QL" : "QS"}
                </span>
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent pointer-events-none">
                  <p className="font-display text-xl text-bone tracking-tight drop-shadow">
                    {formatQAR(l.priceQAR)}
                  </p>
                </div>
              </>
            }
          />
        ) : (
          <div className="relative aspect-[4/3] bg-sand overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-ink-muted-2 text-xs uppercase tracking-wider font-mono">
              No image
            </div>
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
              {isFresh && (
                <span className="chip bg-brand/95 text-bone border-transparent">
                  <Sparkles size={10} /> Just added
                </span>
              )}
              {l.isBrandNew && (
                <span className="chip bg-ink text-bone border-transparent">New</span>
              )}
            </div>
            <span className="absolute top-3 right-3 chip z-10">
              {l.source === "qatarliving" ? "QL" : "QS"}
            </span>
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent">
              <p className="font-display text-xl text-bone tracking-tight drop-shadow">
                {formatQAR(l.priceQAR)}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          <div className="flex items-baseline justify-between gap-2 min-w-0">
            <h2 className="font-display text-lg leading-tight truncate">
              {l.make} {l.model}
            </h2>
            {l.year != null && (
              <span className="font-mono text-xs text-ink-muted whitespace-nowrap">
                {l.year}
              </span>
            )}
          </div>
          {l.trim && (
            <p className="text-xs text-ink-muted-2 truncate mt-0.5">{l.trim}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-muted">
            <SpecPill icon={<Gauge size={12} />} text={formatKM(l.mileageKM)} />
            {l.fuelType && (
              <SpecPill icon={<Fuel size={12} />} text={l.fuelType} />
            )}
            {l.location && (
              <SpecPill icon={<MapPin size={12} />} text={l.location} />
            )}
          </div>

          {features.length > 0 && (
            <p className="text-xs text-ink-muted-2 mt-3 truncate">
              {features.slice(0, 3).join(" · ")}
              {features.length > 3 && ` · +${features.length - 3} more`}
            </p>
          )}

          <div className="mt-auto pt-4 flex items-center justify-between border-t border-ink/5 mt-4">
            <p className="text-[10px] text-ink-muted-2 font-mono truncate flex-1">
              {l.dealerName ?? "Private seller"}
            </p>
            <p className="text-[10px] text-ink-muted-2 font-mono whitespace-nowrap ml-2 flex items-center gap-1">
              <Calendar size={10} />
              {formatRelative(l.sourceUpdatedAt ?? l.firstSeenAt)}
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}

function SpecPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span className="text-ink-muted-2">{icon}</span>
      {text}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <p className="font-display text-2xl">No listings yet</p>
      <p className="text-sm text-ink-muted mt-2 max-w-xs mx-auto">
        Run <code className="font-mono text-ink">npm run sync</code> to fetch the first batch.
      </p>
    </div>
  );
}
