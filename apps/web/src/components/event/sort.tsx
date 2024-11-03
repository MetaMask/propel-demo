"use client";

import { Button } from "@/components/ui/button";
import { directionFilterSchema } from "@/lib/validators";
import { ArrowDownNarrowWideIcon, ArrowUpNarrowWideIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function EventDirectionToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? undefined;
  const d = searchParams.get("d") ?? undefined;
  const direction = directionFilterSchema.optional().default("asc").parse(d);

  const handleToggle = () => {
    const newSearchParams: Record<string, string> = {};
    if (direction === "asc") {
      newSearchParams.d = "desc";
    } else {
      newSearchParams.d = "asc";
    }
    if (q) {
      newSearchParams.q = q;
    }
    const urlSearchParams = new URLSearchParams(newSearchParams);
    router.push(`${pathname}?${urlSearchParams.toString()}`);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleToggle}>
      {direction === "asc" ? (
        <ArrowUpNarrowWideIcon />
      ) : (
        <ArrowDownNarrowWideIcon />
      )}
    </Button>
  );
}
