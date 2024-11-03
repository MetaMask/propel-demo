import { EventStatus } from "@/components/event/detail";
import { CancelPledgeButton, PledgeButton } from "@/components/pledge/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Status, type Event } from "@/lib/types";
import { isHostedImage } from "@/lib/url";
import { cn, createMapsLink, formatZonedUTC, isPledgeMine } from "@/lib/utils";
import { api } from "@/trpc/server";
import { auth } from "@clerk/nextjs/server";
import { Markdown } from "@react-email/components";
import { format, formatDistanceToNow } from "date-fns";
import {
  CalendarIcon,
  Clock,
  ClockIcon,
  CoinsIcon,
  ExternalLinkIcon,
  MapPinIcon,
  User2Icon,
  UsersIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "react-qr-code";
import { GenerateCoverMeDrawer } from "../cover/generate-drawer";
import { buttonVariants } from "../ui/button";
import { ShareEvent } from "./share";
import { SoLaIcon } from "../icons";

export async function EventCard({ event }: { event: Event }) {
  const {
    id,
    userId,
    title,
    expiresAt,
    imageUrl,
    status,
    minTickets,
    happensAt,
    pledgePrice,
  } = event;
  const allPledges = await api.pledge.all({ eventId: id });
  const creator = await api.clerk.byId({ id: userId });
  const { userId: currentUserId } = auth();

  const myPledge = allPledges.find((p) => isPledgeMine(p, currentUserId));

  const supporters = allPledges.length;

  const fundTarget = minTickets * pledgePrice;
  const fundProgress = Math.floor(
    (allPledges.reduce((acc, pledge) => acc + pledge.amount, 0) / fundTarget) *
      100,
  );
  const timeLeft = formatDistanceToNow(expiresAt, { addSuffix: true });

  return (
    <Card className="mx-auto w-full">
      <Link href={`/event/${event.id}`}>
        <div className="relative h-48 w-full rounded-t-lg bg-black/20">
          <EventStatus
            event={event}
            className="absolute left-2.5 top-2 z-10 text-black"
          />
          {imageUrl ? (
            isHostedImage(imageUrl) ? (
              <Image
                src={imageUrl}
                alt={title}
                className="absolute h-full w-full rounded-t-lg object-cover"
                fill
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={title}
                className="absolute h-full w-full rounded-t-lg object-cover"
              />
            )
          ) : null}
        </div>
        <CardHeader className="pb-2 text-left">
          <CardTitle className="truncate text-lg font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center truncate text-sm text-muted-foreground">
              <Avatar className="mr-1 h-4 w-4">
                <AvatarImage src={creator.imageUrl} />
                <AvatarFallback>
                  <User2Icon />
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{creator.name ?? creator.email}</span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatZonedUTC(happensAt, "MMM d, h:mma")}</span>
            </div>
          </div>
          <div className="flex gap-4 font-semibold">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <UsersIcon className="h-4 w-4" />
              <span>{supporters}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CoinsIcon className="h-4 w-4" />
              <span>{!!fundTarget ? `${fundProgress}%` : "N/A"}</span>
            </div>
            {status === Status.ACTIVE && (
              <div className="flex items-center text-sm text-muted-foreground">
                <ClockIcon className="mr-1 h-4 w-4" />
                <span>{timeLeft}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Link>
      <CardFooter className="flex items-center justify-between gap-2">
        <PledgeButton event={event} creator={creator} myPledge={myPledge} />
        <GenerateCoverMeDrawer event={event} myPledge={myPledge} />
      </CardFooter>
    </Card>
  );
}

export async function EventDetailHeaderCard({ event }: { event: Event }) {
  const creator = await api.clerk.byId({ id: event.userId });
  const { title, imageUrl, location, happensAt, endsAt } = event;
  return (
    <Card>
      {imageUrl ? (
        <div className="relative h-48 w-full">
          {isHostedImage(imageUrl) ? (
            <Image
              src={imageUrl}
              alt={title}
              className="absolute h-full w-full rounded-t-lg object-cover"
              fill
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              className="absolute h-full w-full rounded-t-lg object-cover"
            />
          )}
        </div>
      ) : null}
      <CardHeader>
        <CardTitle>Event Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Avatar className="h-4 w-4">
              <AvatarImage src={creator.imageUrl} />
              <AvatarFallback>
                <User2Icon />
              </AvatarFallback>
            </Avatar>
            <span>Created by: {creator.name ?? creator.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon
              className={cn(
                "h-4 w-4 flex-shrink-0",
                endsAt && "mt-0.5 self-start",
              )}
            />
            <span>
              {`${formatZonedUTC(happensAt)} ${
                endsAt ? ` until ${formatZonedUTC(endsAt)}` : ""
              }`}
            </span>
          </div>
          {location && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 self-start" />
              <Link
                href={createMapsLink(location)}
                target="_blank"
                className="flex items-center gap-1"
              >
                {location}
                <ExternalLinkIcon className="h-3 w-3" />
              </Link>
            </div>
          )}
          {event.solaEventId && (
            <Link
              href={`https://app.sola.day/event/detail/${event.solaEventId}`}
              className="flex items-center gap-2"
            >
              <SoLaIcon />
              <span className="flex items-center gap-1">
                View on Social Layer
                <ExternalLinkIcon className="h-3 w-3" />
              </span>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EventDetailDescriptionCard({ event }: { event: Event }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Description</CardTitle>
      </CardHeader>
      <CardContent className="markdown">
        <Markdown>{event.description}</Markdown>
      </CardContent>
    </Card>
  );
}

export async function EventProgressCard({ event }: { event: Event }) {
  const { minTickets, expiresAt, createdAt, status, userId, pledgePrice } =
    event;
  const pledges = await api.event.pledges({ id: event.id });
  const creator = await api.clerk.byId({ id: userId });

  const supporters = pledges.count;
  const fundTarget = minTickets * pledgePrice;
  const currentFund = pledges.count * pledgePrice;
  const fundProgress = Math.floor((currentFund / fundTarget) * 100);
  const atteendeeProgress = Math.floor((supporters / minTickets) * 100);
  const timeLeft = formatDistanceToNow(expiresAt, { addSuffix: true });
  const isFundPledge = pledgePrice > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supporters Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress
          value={isFundPledge ? fundProgress : atteendeeProgress}
          className="mb-2 w-full"
        />
        <div className="flex flex-col gap-4">
          <div className="flex justify-between text-sm font-semibold">
            <>
              <span>{supporters} supporters</span>
              <span>{minTickets} goal</span>
            </>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center text-sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>{timeLeft}</span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4" />
              <span>Created on {format(createdAt, "MMMM d, yyyy")}</span>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                <span>{minTickets} min supporters</span>
              </div>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                <span>{supporters} Supporters</span>
              </div>
            </div>
          </div>
          {pledges.mine && (
            <div className="flex flex-col gap-2">
              <span className="font-bold">
                Your pledge: ${pledges.mine.amount}
              </span>
              {status === Status.ACTIVE && (
                <CancelPledgeButton pledge={pledges.mine} />
              )}
            </div>
          )}
          {!pledges.mine && <PledgeButton event={event} creator={creator} />}
          {!pledges.mine && (
            <GenerateCoverMeDrawer event={event} myPledge={pledges.mine} />
          )}
          <ShareEvent event={event} />
        </div>
      </CardContent>
    </Card>
  );
}

export async function EventDetailAttendeesCard({ event }: { event: Event }) {
  const { userId } = auth();
  if (event.userId !== userId || event.status !== Status.COMPLETED) {
    return null;
  }

  const data = await api.pledge.valid({ eventId: event.id });
  const plegerUserIds = data.pledges.map((p) => p.attendeeId ?? p.userId);
  const pledgers = await api.clerk.map({ ids: plegerUserIds });
  const pledgersEmails = Array.from(pledgers.values()).map((p) => p.email);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendees</CardTitle>
      </CardHeader>
      <CardContent>
        {data.pledges.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Avatar className="mr-1 h-4 w-4">
                <AvatarImage
                  src={pledgers.get(p.attendeeId ?? p.userId)?.imageUrl}
                />
                <AvatarFallback>
                  <User2Icon />
                </AvatarFallback>
              </Avatar>
              <span>
                {pledgers.get(p.attendeeId ?? p.userId)?.name ??
                  pledgers.get(p.attendeeId ?? p.userId)?.email}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Link
          href={`mailto:${pledgersEmails.join(",")}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Email attendees
        </Link>
      </CardFooter>
    </Card>
  );
}

export async function EventDetailQRTicketCard({ event }: { event: Event }) {
  const { userId } = auth();
  const placed = await api.pledge.placed({ eventId: event.id });
  if (!placed[0]?.accepted) {
    return null;
  }
  const ticketData = JSON.stringify({ eventId: event.proposalAddress, userId });

  return (
    <Card className="flex flex-col items-center">
      <CardHeader className="text-xl font-semibold">
        <CardTitle>Your Ticket</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <QRCode value={ticketData} size={200} />
        <p className="mt-4 text-sm text-muted-foreground">
          Show this QR code to the organizer to verify your ticket
        </p>
      </CardContent>
    </Card>
  );
}
