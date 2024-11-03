"use client";

import { type Event } from "@/lib/types";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "../credenza";
import { Button } from "../ui/button";
import { buildEventLink } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export const ShareEvent = ({ event }: { event: Event }) => {
  const { toast } = useToast();

  const onCopyLink = async () => {
    const eventLink = buildEventLink(event.id, "link-copy");
    await navigator.clipboard.writeText(eventLink);
    toast({
      title: "Copied link to clipboard!",
    });
  };

  const onShareTwitter = () => {
    const eventLink = buildEventLink(event.id, "twitter-share");
    const tweetText =
      encodeURIComponent(`Check out this cool experiment! Propel your events with community support.
@MetaMaskDev @JoinEdgeCity
${eventLink}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    window.open(twitterUrl, "_blank");
  };

  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button className="w-full">Share to boost event</Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle className="text-left">Share Event</CredenzaTitle>
          <CredenzaDescription className="text-left">
            Share the event link to boost your event!
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="flex gap-2">
          <Button onClick={onCopyLink}>Copy Link</Button>
          <Button onClick={onShareTwitter}>Share on Twitter</Button>
        </CredenzaBody>
        <CredenzaFooter>
          <CredenzaClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
};
