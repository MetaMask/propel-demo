import {
  boolean,
  customType,
  integer,
  pgTableCreator,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { Status, type EventStatus } from "@/lib/types";
import { type DelegationStruct } from "@codefi/delegator-core-viem";
import { DEFAULT_MIN_TICKETS } from "@/lib/constants";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";

const customJsonb = <TData>(name: string) =>
  customType<{ data: TData; driverData: string }>({
    dataType() {
      return "jsonb";
    },
    fromDriver(value: string): TData {
      return JSON.parse(value, (k, v) => {
        if (k === "salt" && typeof v === "string") {
          try {
            return BigInt(v);
          } catch (e) {
            return v;
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return v;
        }
      }) as TData;
    },
    toDriver(value: TData): string {
      return JSON.stringify(
        value,
        (_, v) => (typeof v === "bigint" ? v.toString() : v) as string,
        2,
      );
    },
  })(name);

export const createTable = pgTableCreator((name) => `ec_${name}`);

export const events = createTable("event", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  userId: text("user_id").notNull(), // event creator (clerk userId)
  proposalAddress: text("proposal_address")
    .$type<`0x${string}`>()
    .notNull()
    .unique(),
  expiresAt: timestamp("expires_at", { withTimezone: false }).notNull(),
  happensAt: timestamp("happens_at", { withTimezone: false }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: false }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  imageUrl: text("image_url"),
  minTickets: integer("min_tickets").notNull().default(DEFAULT_MIN_TICKETS),
  pledgePrice: integer("pledge_price").notNull(),
  status: text("status", {
    enum: Object.values(Status) as [EventStatus, ...EventStatus[]],
  })
    .notNull()
    .default(Status.ACTIVE),
  nonce: customJsonb<bigint>("nonce").notNull(),
  solaEventId: text("sola_event_id"),
});

export const pledges = createTable("pledge", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  // this is the user id of the person that is paying for the pledge
  userId: text("user_id").notNull(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  amount: integer("amount").notNull(),
  delegation: customJsonb<DelegationStruct>("delegation").notNull(),
  accepted: boolean("accepted").notNull().default(false),
  // this is the address of the person that is receiving the ticket
  attendeeAddress: text("attendee_address").$type<`0x${string}`>(),
  // this is the clerk user id of the person that is receiving the ticket
  attendeeId: text("attendee_id"),
});

export const coverMe = createTable("cover_me", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  requesterId: text("requester_id").notNull(), // User requesting to be covered
  requesterAddress: text("requester_address").$type<`0x${string}`>().notNull(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  coveredById: text("covered_by_id"), // User who covered the request (nullable until someone covers)
});

// Add relations for the coverMe table
export const coverMeRelations = relations(coverMe, ({ one }) => ({
  event: one(events, {
    fields: [coverMe.eventId],
    references: [events.id],
  }),
}));
