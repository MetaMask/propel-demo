import {
  EventDetailAttendeesCard,
  EventDetailDescriptionCard,
  EventDetailHeaderCard,
  EventDetailQRTicketCard,
  EventProgressCard,
} from "@/components/event/card";
import { EventTicketScanner } from "@/components/event/tickets";
import { statusColors } from "@/lib/constants";
import { Status, type Event } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SignedIn } from "@clerk/nextjs";

export function EventDetail({ event }: { event: Event }) {
  return (
    <div className="mx-auto flex w-full flex-col gap-4">
      <EventDetailHeaderCard event={event} />
      <SignedIn>
        <EventDetailAttendeesCard event={event} />
        <EventTicketScanner event={event} />
        <EventDetailQRTicketCard event={event} />
      </SignedIn>
      <EventDetailDescriptionCard event={event} />
      <EventProgressCard event={event} />
    </div>
  );
}

export function EventStatus({
  event,
  className,
}: {
  event: Event;
  className?: string;
}) {
  let label = event.status as string;
  let color = statusColors[event.status];
  const status = event.status;
  if (status === Status.COMPLETED && new Date() <= event.happensAt) {
    label = "Happening soon";
    color = "bg-gray-100";
  } else if (status === Status.COMPLETED && new Date() > event.happensAt) {
    label = "Past event";
    color = "bg-gray-400";
  }
  return (
    <div
      className={cn(
        `gray inline-block w-fit rounded-full px-4 text-sm font-semibold capitalize opacity-95`,
        color,
        className,
      )}
    >
      {label}
    </div>
  );
}

export function EventTitle({ event }: { event: Event }) {
  return (
    <div className="flex w-auto flex-col text-left">
      <h1 className="mb-2 text-xl font-bold">{event.title}</h1>
      <EventStatus event={event} />
    </div>
  );
}
