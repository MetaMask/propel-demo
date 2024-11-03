import { CoverPledgeButton } from "@/components/cover/pledge-button";
import { RequesterCard } from "@/components/cover/requester-card";
import { EventDetailHeaderCard } from "@/components/event/card";
import { EventTitle } from "@/components/event/detail";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/trpc/server";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { type Metadata } from "next";

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id;
  const coverMeRequest = await api.coverMe.get({ id });
  const event = coverMeRequest?.event;
  const user = await api.clerk.byId({ id: coverMeRequest.requesterId });
  const pledgePrice = event?.pledgePrice;

  if (!coverMeRequest) {
    return {
      title: "Request Not Found",
    };
  }

  const title = "Cover a pledge";

  const description = `${user.name} is asking you to cover a ${formatCurrency(pledgePrice)} pledge for "${event.title}" event.`;

  return {
    title,
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

export default async function CoverPage({ params }: Props) {
  const request = await api.coverMe.get({ id: params.id });
  const eventCreator = await api.clerk.byId({ id: request.event?.userId });
  const requester = await api.clerk.byId({ id: request.requesterId });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <EventTitle event={request.event} />
      <RequesterCard requester={requester} />
      <EventDetailHeaderCard event={request.event} />
      <SignedIn>
        <CoverPledgeButton
          event={request.event}
          coverMeRequest={request}
          eventCreator={eventCreator}
          requester={requester}
        />
      </SignedIn>
      <SignedOut>
        <SignInButton>
          <Button variant="outline">Sign in to cover</Button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}
