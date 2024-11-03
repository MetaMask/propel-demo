import { EventControls } from "@/components/event/controls";
import { EventDetail, EventTitle } from "@/components/event/detail";
import { EmptyEvent } from "@/components/event/empty";
import { api } from "@/trpc/server";
import { type Metadata } from "next";
import { SignedIn } from "@clerk/nextjs";

type PageProps = {
  params: { id: string };
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const id = params.id;
  const event = await api.event.byId({ id });

  if (!event) {
    return {
      title: "Event Not Found",
    };
  }

  const description = `Join us for ${event.title} on ${new Date(event.happensAt).toLocaleDateString()} at ${event.location}`;

  return {
    title: event.title,
    description,
    openGraph: {
      siteName: "Propel",
      title: event.title,
      description,
      images: [
        {
          url: event.imageUrl ?? "",
          alt: event.title,
          height: 630,
          width: 1200,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: event.imageUrl ?? undefined,
    },
  };
}

export default async function EventPage({ params }: PageProps) {
  const event = await api.event.byId({ id: params.id });

  if (!event) {
    return <EmptyEvent />;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <EventTitle event={event} />
      <EventDetail event={event} />
      <SignedIn>
        <EventControls event={event} imageUpload />
      </SignedIn>
    </div>
  );
}
