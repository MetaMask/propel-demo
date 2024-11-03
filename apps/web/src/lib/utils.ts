import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { twMerge } from "tailwind-merge";
import { TIMEZONE } from "./constants";
import {
  type Event,
  type EventStatus,
  type Pledge,
  type QRCodeTicketData,
} from "./types";
export { parse, stringify } from "superjson";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const truncateHash = (hash: string) => {
  return `${hash.slice(0, 6)}...${hash.slice(-8)}`;
};

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const isQRCodeTicketFormatValid = (data: string): boolean => {
  try {
    const parsed = JSON.parse(data) as QRCodeTicketData;
    return (
      typeof parsed.userId === "string" && typeof parsed.eventId === "string"
    );
  } catch {
    return false;
  }
};

export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString()} USDC`;
};

export const bigIntToNumber = (amount: bigint): number => {
  return Number(amount / 1000000n);
};

export const numberToUSDC = (amount: number): string => {
  return BigInt(amount * 1000000).toString();
};

export const formatBigIntToCurrency = (amount: bigint): string => {
  return formatCurrency(bigIntToNumber(amount));
};

export const buildDaimoRedirectUrl = () => {
  if (typeof window === "undefined") return "";
  const baseUrl =
    window.location.protocol +
    "//" +
    window.location.hostname +
    (window.location.port ? ":" + window.location.port : "");
  return `${baseUrl}?wallet=true`;
};

export const buildEventLink = (eventId: string, source?: string) => {
  const baseUrl =
    window.location.protocol +
    "//" +
    window.location.hostname +
    (window.location.port ? ":" + window.location.port : "");
  return `${baseUrl}/event/${eventId}${source ? `?source=${source}` : ""}`;
};

export const getTimestamp = (date: Date) => {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
};

export const getZonedUTC = (date: Date) => {
  const timestamp = getTimestamp(date);
  console.log(timestamp);
  const userSelectedDate = new Date(timestamp);
  const zonedUtc = fromZonedTime(userSelectedDate, TIMEZONE);
  console.log(zonedUtc);
  return zonedUtc;
};

export const formatZonedUTC = (date: Date, formatString?: string) => {
  return format(
    toZonedTime(date, TIMEZONE),
    formatString ?? "MMMM d, yyyy 'at' h:mma",
  );
};

export const sortByStatus = (list: Event[], status: EventStatus) => {
  return [
    ...list.filter((i) => i.status === status),
    ...list.filter((i) => i.status !== status),
  ];
};

export const isPledgeMine = (p: Pledge, userId?: string | null) => {
  return (
    p.attendeeId === userId || (p.attendeeId === null && p.userId === userId)
  );
};

export const createMapsLink = (location: string) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    location,
  )}`;
};
