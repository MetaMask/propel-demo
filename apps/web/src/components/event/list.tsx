import { Suspense } from "react";
import { api } from "@/trpc/server";
import {
  Status,
  type EventDirectionFilter,
  type EventQueryFilter,
} from "@/lib/types";
import {
  EventCardSkeleton,
  EventListSkeleton,
} from "@/components/event/skeleton";
import { EmptyEvents } from "@/components/event/empty";
import { EventCard } from "@/components/event/card";
import { auth } from "@clerk/nextjs/server";
import { sortByStatus } from "@/lib/utils";

export type EventListProps = {
  direction?: EventDirectionFilter;
  query?: EventQueryFilter;
};

export function EventList({ direction, query }: EventListProps) {
  return (
    <Suspense key={query} fallback={<EventListSkeleton />}>
      <EventListInner direction={direction} query={query} />
    </Suspense>
  );
}

async function EventListInner({ direction, query }: EventListProps) {
  const { userId } = auth();
  const list = userId
    ? await api.event.filter({
        direction,
        query,
      })
    : await api.event.byStatus({ status: "active" });

  if (!list.length) {
    return <EmptyEvents q={query ?? "explore"} />;
  }

  const activeFirstList = sortByStatus(list, Status.ACTIVE);

  return (
    <div className="grid grid-cols-1 gap-6 md:mb-0 md:grid-cols-2 lg:grid-cols-3">
      {activeFirstList.map((ev) => (
        <Suspense key={ev.id} fallback={<EventCardSkeleton />}>
          <EventCard key={ev.id} event={ev} />
        </Suspense>
      ))}
    </div>
  );
}
