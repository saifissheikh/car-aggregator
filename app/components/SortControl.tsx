"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { SORT_OPTIONS, type SortValue } from "./sort-options";

export function SortControl({ value }: { value: SortValue }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(next: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set("sort", next);
    sp.set("page", "1");
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <label className="relative inline-flex items-center gap-2">
      <span className="label">Sort</span>
      <span className="relative inline-block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-paper/90 border border-ink/10 rounded-full pl-4 pr-9 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ink/20 hover:border-ink/30 transition cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted"
        />
      </span>
    </label>
  );
}
