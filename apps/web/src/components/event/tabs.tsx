"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryFilterSchema } from "@/lib/validators";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function EventTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const d = searchParams.get("d") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const tab = queryFilterSchema.optional().default("explore").parse(q);

  const handleTabChange = (value: string) => {
    const newSearchParams: Record<string, string> = {};
    newSearchParams.q = value;
    if (d) {
      newSearchParams.d = d;
    }
    const urlSearchParams = new URLSearchParams(newSearchParams);
    router.push(`${pathname}?${urlSearchParams.toString()}`);
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList className="w-fit">
        <TabsTrigger value="explore" className="text-xs sm:text-sm">
          Explore
        </TabsTrigger>
        <TabsTrigger value="created" className="text-xs sm:text-sm">
          My Events
        </TabsTrigger>
        <TabsTrigger value="pledged" className="text-xs sm:text-sm">
          Pledges
        </TabsTrigger>
        <TabsTrigger value="attending" className="text-xs sm:text-sm">
          Tickets
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
