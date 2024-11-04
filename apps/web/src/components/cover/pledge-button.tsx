"use client";

import { useToast } from "@/hooks/use-toast";
import { createPledgeDelegation } from "@/lib/delegator";
import {
  Status,
  type CoverMeRequest,
  type Event,
  type PublicUser,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useDelegator } from "@/providers/delegator";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { ConfirmationDrawer } from "../confirmation-drawer";
import { Button } from "../ui/button";
import { useWallet } from "@/hooks/use-wallet";

interface Props {
  event: Event;
  coverMeRequest: CoverMeRequest;
  eventCreator: PublicUser;
  requester: PublicUser;
}

export function CoverPledgeButton({
  event,
  eventCreator,
  coverMeRequest,
  requester,
}: Props) {
  const { toast } = useToast();
  const { delegatorAccount } = useDelegator();
  const router = useRouter();
  const { data: wallet } = useWallet();

  const { mutateAsync: createPledge, isPending } =
    api.pledge.createCovered.useMutation({
      onSuccess: () => {
        toast({
          title: "Success!",
          description: "You have successfully covered this ticket",
        });
        router.push("/");
      },
      onError: (error) => {
        console.error(error.shape?.message ?? error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.shape?.message ?? error.message,
        });
      },
    });

  const handlePledge = async () => {
    if (!wallet) {
      toast({
        title: "Error",
        description: "Wallet not found. Please, refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (wallet.balance < event.pledgePrice) {
      return toast({
        title: "Insufficient funds",
        description:
          "You don't have enough funds available for this pledge amount. Please add more funds to your wallet.",
        variant: "destructive",
      });
    }

    if (!!coverMeRequest.coveredById) {
      toast({
        title: "Error",
        description: "This pledge has already been covered",
      });
      return;
    }

    if (!delegatorAccount) {
      throw new Error("No delegator account found");
    }

    const delegation = await createPledgeDelegation({
      delegatorAccount,
      pledgeAmount: event.pledgePrice,
      proposalCreatorAddress: eventCreator.walletAddress!,
      attendeeAddress: coverMeRequest.requesterAddress,
      proposalAddress: event.proposalAddress,
    });

    await createPledge({
      coverMeRequestId: coverMeRequest.id,
      delegation,
    });
  };

  return (
    <ConfirmationDrawer
      title="Cover a pledge"
      confirmButtonText="Confirm"
      cancelButtonText="Never mind"
      description={`Do you want to cover a pledge of ${formatCurrency(event.pledgePrice)} to ${requester.name}?`}
      onConfirm={handlePledge}
      isLoading={isPending}
    >
      <Button
        disabled={
          !delegatorAccount || isPending || event.status !== Status.ACTIVE
        }
        className="w-full"
      >
        {isPending
          ? "Pledging..."
          : `Pledge ${formatCurrency(event.pledgePrice)}`}
      </Button>
    </ConfirmationDrawer>
  );
}
