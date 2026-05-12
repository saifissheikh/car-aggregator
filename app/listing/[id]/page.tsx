import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Phone,
  MessageCircle,
  Sparkles,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Cog,
  DoorOpen,
  Users,
  Shield,
  Star,
  Wrench,
  Building2,
  Palette,
  Car,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatQAR, formatKM, formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ListingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) notFound();

  const images = (listing.images as string[]) ?? [];
  const features = (listing.features as string[]) ?? [];
  const waNumber = listing.contactWhatsapp?.replace(/[^0-9]/g, "");
  const phoneNumber = listing.contactPhone?.replace(/[^0-9+]/g, "");

  const isFresh =
    Date.now() - new Date(listing.firstSeenAt).getTime() < 24 * 60 * 60 * 1000;

  const contactButtons = (
    <div className="flex gap-3">
      {waNumber && (
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-ink text-bone py-3.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 hover:bg-ink/90 transition shadow-soft"
        >
          <MessageCircle size={16} />
          WhatsApp
        </a>
      )}
      {phoneNumber && (
        <a
          href={`tel:${phoneNumber}`}
          className="flex-1 border border-ink py-3.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 hover:bg-ink hover:text-bone transition"
        >
          <Phone size={16} />
          Call
        </a>
      )}
    </div>
  );

  return (
    <main className="min-h-screen">
      <div className="sticky top-0 z-20 bg-bone/85 backdrop-blur-md border-b border-ink/10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm hover:opacity-70 transition"
          >
            <ArrowLeft size={16} />
            <span className="font-mono text-xs uppercase tracking-wider">Back to feed</span>
          </Link>
          <a
            href={listing.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-ink-muted hover:text-ink transition"
          >
            View source
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl md:px-8 lg:px-12 md:py-10 md:grid md:grid-cols-[1.4fr_1fr] xl:grid-cols-[1.55fr_1fr] md:gap-10 lg:gap-14">
        {/* Image gallery */}
        {images.length > 0 ? (
          <div className="md:space-y-4">
            {/* Mobile: horizontal snap-x carousel */}
            <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory bg-sand no-scrollbar">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="relative shrink-0 w-full aspect-[4/3] snap-center"
                >
                  <Image
                    src={src}
                    alt={`${listing.make ?? ""} ${listing.model ?? ""} — ${i + 1}`}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    unoptimized
                    priority={i === 0}
                  />
                  <span className="absolute bottom-3 right-3 chip bg-ink/70 text-bone border-transparent">
                    {i + 1} / {images.length}
                  </span>
                </div>
              ))}
            </div>

            {/* Desktop: hero + grid */}
            <div className="hidden md:block">
              <div className="relative w-full aspect-[16/10] bg-sand rounded-2xl overflow-hidden shadow-soft">
                <Image
                  src={images[0]}
                  alt={`${listing.make ?? ""} ${listing.model ?? ""}`}
                  fill
                  sizes="(max-width: 1280px) 60vw, 800px"
                  className="object-cover"
                  unoptimized
                  priority
                />
                <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                  {isFresh && (
                    <span className="chip bg-brand/95 text-bone border-transparent">
                      <Sparkles size={10} /> Just added
                    </span>
                  )}
                  {listing.isBrandNew && (
                    <span className="chip bg-ink text-bone border-transparent">
                      Brand new
                    </span>
                  )}
                </div>
              </div>
              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {images.slice(1, 7).map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-[4/3] bg-sand rounded-xl overflow-hidden shadow-soft"
                    >
                      <Image
                        src={src}
                        alt={`Photo ${i + 2}`}
                        fill
                        sizes="(max-width: 1280px) 20vw, 260px"
                        className="object-cover"
                        unoptimized
                      />
                      {i === 5 && images.length > 7 && (
                        <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                          <span className="font-display text-bone text-2xl">
                            +{images.length - 7}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Info column */}
        <div className="md:self-start">
          {/* Title block */}
          <div className="px-5 sm:px-8 md:px-0 py-6 md:pt-0 border-b border-ink/10 md:border-b-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="chip">
                {listing.source === "qatarliving" ? "Qatar Living" : "Qatar Sale"}
              </span>
              {listing.location && (
                <span className="chip">
                  <MapPin size={10} /> {listing.location}
                </span>
              )}
              {isFresh && (
                <span className="chip bg-brand/95 text-bone border-transparent md:hidden">
                  <Sparkles size={10} /> Just added
                </span>
              )}
              {listing.isShowroom && (
                <span className="chip bg-olive/95 text-bone border-transparent">
                  <Building2 size={10} /> Showroom
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl md:text-4xl leading-tight">
              {listing.make} {listing.model}
              {listing.trim && (
                <span className="text-ink-muted"> {listing.trim}</span>
              )}
            </h1>

            <div className="mt-4 flex items-baseline gap-3 flex-wrap">
              <p className="font-display text-3xl md:text-4xl text-brand">
                {formatQAR(listing.priceQAR)}
              </p>
              {listing.installmentsAvailable && (
                <span className="chip">Installments available</span>
              )}
            </div>

            <p className="text-xs text-ink-muted mt-3 font-mono flex items-center gap-1.5">
              <Calendar size={12} />
              Posted {formatRelative(listing.sourceUpdatedAt ?? listing.firstSeenAt)}
              {" · "}Discovered {formatRelative(listing.firstSeenAt)}
            </p>

            <div className="hidden md:block mt-6">{contactButtons}</div>
          </div>

          {/* Key specs strip — visual */}
          <div className="px-5 sm:px-8 md:px-0 py-6 md:py-8 border-t border-ink/10">
            <p className="label mb-4">Vehicle</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-4">
              <SpecCard icon={<Calendar size={16} />} label="Year" value={listing.year?.toString()} />
              <SpecCard icon={<Gauge size={16} />} label="Mileage" value={formatKM(listing.mileageKM)} />
              <SpecCard icon={<Fuel size={16} />} label="Fuel" value={listing.fuelType} />
              <SpecCard icon={<Cog size={16} />} label="Engine" value={engineLabel(listing)} />
              <SpecCard icon={<Cog size={16} />} label="Cylinders" value={listing.cylinders} />
              <SpecCard icon={<Car size={16} />} label="Drive" value={listing.wheelDrive} />
              <SpecCard icon={<DoorOpen size={16} />} label="Doors" value={listing.doors} />
              <SpecCard icon={<Users size={16} />} label="Seats" value={seatLabel(listing)} />
              <SpecCard icon={<Palette size={16} />} label="Interior" value={listing.interiorColor} />
              <SpecCard icon={<Palette size={16} />} label="Exterior" value={listing.exteriorColor} />
              <SpecCard icon={<Wrench size={16} />} label="Service" value={listing.serviceHistory} />
              <SpecCard icon={<Shield size={16} />} label="Insurance" value={listing.insuranceType} />
              <SpecCard icon={<Building2 size={16} />} label="Import" value={listing.imported} />
              <SpecCard icon={<Star size={16} />} label="Deal rating" value={dealRatingLabel(listing.dealRating)} />
            </div>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="px-5 sm:px-8 md:px-0 py-6 md:py-8 border-t border-ink/10">
              <p className="label mb-4">Features</p>
              <div className="flex flex-wrap gap-2">
                {features.map((f) => (
                  <span key={f} className="chip bg-paper border-ink/10">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div className="px-5 sm:px-8 md:px-0 py-6 md:py-8 border-t border-ink/10">
              <p className="label mb-3">Description</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink/90">
                {listing.description}
              </p>
            </div>
          )}

          {/* Seller */}
          {(listing.dealerName || phoneNumber || waNumber) && (
            <div className="px-5 sm:px-8 md:px-0 py-6 md:py-8 border-t border-ink/10">
              <p className="label mb-3">Seller</p>
              {listing.dealerName && (
                <p className="font-display text-lg">{listing.dealerName}</p>
              )}
              <div className="mt-2 space-y-1 text-sm text-ink-muted font-mono">
                {phoneNumber && <p>{listing.contactPhone}</p>}
                {waNumber && waNumber !== phoneNumber && (
                  <p>WhatsApp: {listing.contactWhatsapp}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="sticky bottom-0 md:hidden bg-bone/95 backdrop-blur border-t border-ink/10 px-5 py-4 z-10">
        {contactButtons}
      </div>
    </main>
  );
}

function SpecCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="bg-paper rounded-xl border border-ink/5 p-3 shadow-soft">
      <div className="flex items-center gap-1.5 text-ink-muted-2">
        {icon}
        <span className="label">{label}</span>
      </div>
      <p className="text-sm mt-1 font-medium text-ink">{value}</p>
    </div>
  );
}

function engineLabel(l: { engineSize?: string | null; cylinders?: string | null }) {
  if (!l.engineSize) return null;
  return `${l.engineSize}L`;
}

function seatLabel(l: { seats?: string | null; seatType?: string | null }) {
  if (!l.seats && !l.seatType) return null;
  if (l.seats && l.seatType) return `${l.seats} · ${l.seatType}`;
  return l.seats ?? l.seatType ?? null;
}

function dealRatingLabel(rating: number | null) {
  if (rating == null) return null;
  const labels: Record<number, string> = {
    1: "Fair",
    2: "Good",
    3: "Great",
    4: "Excellent",
    5: "Outstanding",
  };
  return `${rating}/5${labels[rating] ? ` — ${labels[rating]}` : ""}`;
}
