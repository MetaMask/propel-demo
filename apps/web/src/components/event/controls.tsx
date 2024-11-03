"use client";

import { Status, type Event } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
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
} from "@/components/credenza";
import { useState } from "react";
import { useDelegator } from "@/providers/delegator";
import { closeBids } from "@/lib/delegator";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { EditEventButton } from "./edit";

export function EventControls({ event, imageUpload }: { event: Event, imageUpload: boolean }) {
  const { user } = useUser();
  if (user?.id !== event.userId) {
    return null;
  }
  return (
    <>
      <EditEventButton event={event} imageUpload={imageUpload} />
      <ConcludeEventButton event={event} />
      <CancelEventButton event={event} />
    </>
  );
}

function CancelEventButton({ event }: { event: Event }) {
  const { toast } = useToast();
  const { mutateAsync: cancelEvent, isPending: isCancelling } =
    api.event.cancel.useMutation();
  const router = useRouter();
  const handleCancel = async () => {
    try {
      await cancelEvent({ id: event.id });
      toast({
        title: "Event canceled",
        description: "Your event has been successfully canceled.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (event.status !== Status.ACTIVE) {
    return null;
  }

  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button variant="destructive" className="flex text-red-500">
          Cancel Event
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className="max-h-90dvh overflow-hidden">
        <CredenzaHeader>
          <CredenzaTitle className="text-left">Cancel Event</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          <p>Once you cancel your event, it cannot be undone.</p>
        </CredenzaBody>
        <CredenzaDescription className="hidden">
          <></>
        </CredenzaDescription>
        <CredenzaFooter>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            Cancel Event
          </Button>
          <CredenzaClose asChild>
            <Button variant="outline" disabled={isCancelling}>
              Close
            </Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}

function ConcludeEventButton({ event }: { event: Event }) {
  const { toast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState<"distribute" | "conclude">("distribute");
  const [ticketsToDistribute, setTicketsToDistribute] = useState(
    event.minTickets.toString(),
  );
  const [isConcluding, setIsConcluding] = useState(false);
  const { delegatorClient } = useDelegator();
  const { mutateAsync: fulfillEvent, isPending: isFulfilling } =
    api.event.fulfill.useMutation();

  const { data: validPledges, isLoading: isValidPledgesLoading } =
    api.pledge.valid.useQuery({ eventId: event.id });
  const { data: allPledges, isLoading: isAllPledgesLoading } =
    api.pledge.all.useQuery({ eventId: event.id });

  const totalPledges = allPledges?.length ?? 0;
  const pledges = validPledges?.pledges;
  const canConclude = validPledges?.isEventReady;
  const maxPledges = pledges?.length ?? 0;

  const isLoading =
    isValidPledgesLoading ||
    isConcluding ||
    isFulfilling ||
    isAllPledgesLoading;

  const handleConclude = async () => {
    try {
      setIsConcluding(true);
      if (!canConclude) {
        toast({
          title: "Event cannot be confirmed",
          description: `The event cannot be confirmed. The number of accetable bids are not enough (Number of accetable bids: ${pledges?.length}, Minimum number of tickets: ${event.minTickets}). Please try again later.`,
        });
        return;
      }

      if (!pledges) {
        toast({
          title: "No pending pledges",
          description: "There are no pending pledges to confirm the event.",
        });
        return;
      }

      const finalPledges = pledges.slice(0, Number(ticketsToDistribute));

      // Close bids
      await closeBids({
        creatorGatorClient: delegatorClient!,
        event,
        pledges: finalPledges,
        awaitUserOpFn: fulfillEvent,
      });

      toast({
        title: "Event confirmed",
        description: "Your event has been successfully confirmed.",
      });

      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConcluding(false);
    }
  };

  const getTitle = () => {
    if (step === "distribute") {
      return "Distribute Tickets";
    }
    return "Stop accepting pledges";
  };

  const onClose = () => {
    setStep("distribute");
  };

  const onNext = () => {
    const ticketsToDistributeNumber = Number(ticketsToDistribute);
    if (maxPledges < event.minTickets) {
      toast({
        title: "Cannot conclude event",
        description: `There are not enough pledges to conclude the event. Some of pledges may not have enough balance to fulfill their pledges. Only ${maxPledges} pledges are acceptable right now (min: ${event.minTickets}).`,
        variant: "destructive",
      });
      return;
    }
    if (ticketsToDistributeNumber < event.minTickets) {
      toast({
        title: "Invalid number of tickets",
        description: `The number of tickets to distribute should be at least ${event.minTickets}.`,
        variant: "destructive",
      });
      return;
    }
    if (ticketsToDistributeNumber > maxPledges) {
      toast({
        title: "Invalid number of tickets",
        description: `There are only ${maxPledges} acceptable pledges to distribute right now. This could happen when some of pledgers may not have enough balance to fulfill their pledges.`,
        variant: "destructive",
      });
      setTicketsToDistribute(maxPledges.toString());
      return;
    }
    setStep("conclude");
  };

  const distributeTicketsContent = (
    <div
      className={cn("flex flex-col gap-2 pt-0", {
        "animate-pulse": isValidPledgesLoading,
      })}
    >
      <div>
        How many tickets do you want to distribute? You needed{" "}
        {event.minTickets} minimum attendees, and received {totalPledges}{" "}
        pledges.
      </div>
      {!isValidPledgesLoading && (
        <div>
          <Label htmlFor="ticketsToDistribute">Number of tickets</Label>
          <Input
            type="number"
            value={ticketsToDistribute}
            onChange={(e) => setTicketsToDistribute(e.target.value)}
            min={event.minTickets}
            max={maxPledges}
            placeholder={event.minTickets.toString()}
          />
        </div>
      )}
    </div>
  );

  const concludeProposalContent = (
    <div className="flex flex-col gap-2 pt-0">
      <div className="text-md font-bold">
        Tickets to distribute: {ticketsToDistribute}
      </div>
      <div>
        Once you stop accepting pledges, funds will be taken from your
        supporters&apos; wallets. There&apos;s no way to undo this, so double
        check your event plans before you continue.
      </div>
    </div>
  );

  if (
    !delegatorClient ||
    totalPledges < event.minTickets ||
    event.status !== Status.ACTIVE ||
    isValidPledgesLoading ||
    isAllPledgesLoading
  ) {
    return null;
  }

  return (
    <Credenza
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <CredenzaTrigger asChild>
        <Button disabled={isLoading}>Conclude Event</Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle className="text-left">{getTitle()}</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          {step === "distribute"
            ? distributeTicketsContent
            : concludeProposalContent}
        </CredenzaBody>
        <CredenzaDescription className="hidden">
          <></>
        </CredenzaDescription>
        <CredenzaFooter>
          <div className="flex w-full gap-2">
            {step === "distribute" && (
              <Button className="flex-1" onClick={onNext} disabled={isLoading}>
                Next
              </Button>
            )}
            {step === "conclude" && (
              <Button
                className="flex-1"
                onClick={handleConclude}
                disabled={isLoading}
              >
                {isConcluding ? "Confirming..." : "Continue"}
              </Button>
            )}
          </div>
          <CredenzaClose asChild>
            <Button variant="outline" className="flex-1" disabled={isLoading}>
              {step === "distribute" ? "Cancel" : "Never mind"}
            </Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
