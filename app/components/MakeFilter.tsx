"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export function MakeFilter({
  value,
  makes,
}: {
  value: string | null;
  makes: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(next: string | null) {
    const sp = new URLSearchParams(params.toString());
    if (!next || next === ALL) {
      sp.delete("make");
    } else {
      sp.set("make", next);
    }
    sp.set("page", "1");
    const s = sp.toString();
    router.push(s ? `${pathname}?${s}` : pathname);
  }

  const selected = value ?? ALL;

  return (
    <div className="inline-flex items-center gap-2">
      <span className="label hidden sm:inline">Make</span>
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger
          aria-label="Filter by make"
          className="h-9 w-[120px] sm:w-auto sm:min-w-[140px] rounded-full bg-paper/90 border-ink/10 px-4 text-sm font-medium text-ink hover:border-ink/30 focus:ring-2 focus:ring-ink/20 focus:ring-offset-0 [&_svg]:text-ink-muted"
        >
          <SelectValue placeholder="Make">
            {(v) => (v === ALL ? "All makes" : v)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          align="end"
          sideOffset={6}
          className="rounded-2xl border-ink/10 bg-paper/95 backdrop-blur shadow-lift w-[220px] max-h-72"
        >
          <SelectItem
            value={ALL}
            className="rounded-lg text-sm py-2.5 focus:bg-bone focus:text-ink data-[state=checked]:text-brand data-[state=checked]:font-medium"
          >
            All makes
          </SelectItem>
          {makes.map((m) => (
            <SelectItem
              key={m}
              value={m}
              className="rounded-lg text-sm py-2.5 focus:bg-bone focus:text-ink data-[state=checked]:text-brand data-[state=checked]:font-medium"
            >
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
