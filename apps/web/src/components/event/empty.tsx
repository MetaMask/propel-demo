import { CalendarPlusIcon, TelescopeIcon, TicketIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateEventButton } from "./create";
import type { EventQueryFilter } from "@/lib/types";

export const EmptyAttendingEvents = () => (
  <div className="flex flex-col items-center justify-center gap-4 rounded-lg p-8 text-center">
    <TicketIcon className="h-12 w-12 text-black" />
    <h2 className="text-xl font-semibold">No tickets available</h2>
    <p className="text-sm text-gray-500">
      Looks like you don&apos;t have tickets for any upcoming events.
    </p>
    <Link href="/">
      <Button>Find an event</Button>
    </Link>
  </div>
);

export const EmptyPledgedEvents = () => (
  <div className="flex flex-col items-center justify-center gap-4 rounded-lg p-8 text-center">
    <TelescopeIcon className="h-12 w-12 text-black" />
    <h2 className="text-xl font-semibold">No active pledges</h2>
    <p className="text-sm text-gray-500">
      Take a look at ideas from your community that need your support.
    </p>
    <Link href="/">
      <Button>Explore events</Button>
    </Link>
  </div>
);

export const EmptyCreatedEvents = async () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg py-8 text-center">
      <CalendarPlusIcon className="h-12 w-12 text-black" />
      <h2 className="text-xl font-semibold">Create an event</h2>
      <p className="text-sm text-gray-500">
        Bring your idea to life with an event.
      </p>
      <CreateEventButton imageUpload>Get Started</CreateEventButton>
    </div>
  );
};

export const EmptyExploreEvents = async () => {
  const imageUpload = false as boolean;
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg py-8 text-center">
      <CalendarPlusIcon className="h-12 w-12 text-black" />
      <h2 className="text-xl font-semibold">Create an event</h2>
      <p className="text-sm text-gray-500">
        Bring your idea to life with an event.
      </p>
      <CreateEventButton imageUpload={imageUpload}>
        Get Started
      </CreateEventButton>
    </div>
  );
};

export const EmptyEvent = () => (
  <div className="flex flex-col items-center justify-center gap-4 rounded-lg p-8 text-center">
    <TicketIcon className="h-12 w-12 text-black" />
    <h2 className="text-xl font-semibold">Event not found</h2>
    <p className="text-sm text-gray-500">
      Looks like this event doesn&apos;t exist.
    </p>
    <Link href="/">
      <Button>Find an event</Button>
    </Link>
  </div>
);

export const EmptyEvents = ({ q }: { q: EventQueryFilter }) => {
  switch (q) {
    case "created":
      return <EmptyCreatedEvents />;
    case "pledged":
      return <EmptyPledgedEvents />;
    case "attending":
      return <EmptyAttendingEvents />;
    default:
      return <EmptyExploreEvents />;
  }
};
