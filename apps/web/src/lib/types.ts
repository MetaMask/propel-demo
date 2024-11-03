import type { z } from "zod";
import type { coverMe, events, pledges } from "@/server/db/schema";
import type {
  directionFilterSchema,
  queryFilterSchema,
  searchParamsSchema,
} from "@/lib/validators";

export type Pledge = typeof pledges.$inferSelect;
export type Event = typeof events.$inferSelect;
export type CoverMeRequest = typeof coverMe.$inferSelect;

declare global {
  interface CustomJwtSessionClaims {
    email: string;
    username?: string;
    imageUrl?: string;
  }

  interface UserPublicMetadata {
    walletAddress?: `0x${string}`;
  }
}

export const Status = {
  ACTIVE: "active",
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELED: "canceled",
  EXPIRED: "expired",
} as const;

export type EventStatus = (typeof Status)[keyof typeof Status];

export type EventDirectionFilter = z.infer<typeof directionFilterSchema>;
export type EventQueryFilter = z.infer<typeof queryFilterSchema>;

export type SearchParams = z.infer<typeof searchParamsSchema>;

export type QRCodeTicketData = {
  eventId: string;
  userId: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
  walletAddress?: `0x${string}`;
};
