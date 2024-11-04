"use client";

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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { createPledgeDelegation } from "@/lib/delegator";
import { type Pledge, Status, type Event, type PublicUser } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useDelegator } from "@/providers/delegator";
import { ConfirmationDrawer } from "../confirmation-drawer";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { USDCInput } from "@/components/usdc-input";
import { useAuth, useClerk } from "@clerk/nextjs";

export function PledgeButton({
  event,
  creator,
  myPledge,
}: {
  event: Event;
  creator: PublicUser;
  myPledge?: Pledge | null;
}) {
  const clerk = useClerk();
  const { userId } = useAuth();
  const { data: wallet } = useWallet();

  const canPledge = event.status === Status.ACTIVE && !!!myPledge;

  if (myPledge) {
    return (
      <Button disabled={true} className="w-full">
        Pledged ${myPledge.amount}
      </Button>
    );
  }

  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button
          className="w-full"
          disabled={(!wallet && !!userId) || !canPledge}
          onClick={async (ev) => {
            if (!userId) {
              ev.preventDefault();
              await clerk.redirectToSignIn();
            }
          }}
        >
          Pledge {formatCurrency(event.pledgePrice)}
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle className="text-left">Pledge</CredenzaTitle>
          <CredenzaDescription className="text-left">
            Pledge at least the amount below in order to attend.
            <br />
            If you&apos;re feeling generous, plege more!
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <PledgeForm event={event} creator={creator} />
        </CredenzaBody>
        <CredenzaFooter>
          <CredenzaClose asChild>
            <Button variant="outline">Cancel</Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}

export function CancelPledgeButton({ pledge }: { pledge: Pledge }) {
  const router = useRouter();
  const { toast } = useToast();
  const { mutateAsync: cancelPledge, isPending: isCancelling } =
    api.pledge.cancel.useMutation();
  const utils = api.useUtils();

  const handleCancel = async () => {
    try {
      await cancelPledge(
        { pledgeId: pledge.id },
        {
          onSuccess: () => {
            toast({
              title: "Pledge canceled",
              description: "Your pledge has been successfully canceled.",
            });
            void utils.pledge.invalidate();
            void utils.event.invalidate();
            router.refresh();
          },
        },
      );
    } catch (error) {
      toast({
        title: "Failed to cancel pledge",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <ConfirmationDrawer
      onConfirm={handleCancel}
      isLoading={isCancelling}
      title="Cancel pledge"
      description="Are you sure you want to cancel your bid?"
      confirmButtonText="Cancel Pledge"
    >
      <Button
        variant="destructive"
        size="sm"
        disabled={isCancelling}
        className="w-fit"
      >
        {isCancelling ? "Cancelling..." : "Cancel Pledge"}
      </Button>
    </ConfirmationDrawer>
  );
}

function PledgeForm({ event, creator }: { event: Event; creator: PublicUser }) {
  const formSchema = z.object({
    amount: z
      .number({
        message: "Invalid amount",
        coerce: true,
      })
      .min(event.pledgePrice, {
        message:
          "Amount must be greater than or equal to the minimum pledge amount",
      }),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: event.pledgePrice,
    },
  });
  const router = useRouter();
  const { toast } = useToast();
  const { delegatorAccount } = useDelegator();
  const { data: wallet } = useWallet();
  const { mutateAsync: createPledge, isPending } =
    api.pledge.create.useMutation();
  const utils = api.useUtils();
  const amount = form.watch("amount");

  if (!wallet) return null;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!wallet) {
      toast({
        title: "Error",
        description: "Wallet not found. Please, refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (wallet.balance < values.amount) {
      return toast({
        title: "Insufficient funds",
        description:
          "You don't have enough funds available for this pledge amount. Please add more funds to your wallet.",
        variant: "destructive",
      });
    }

    if (!delegatorAccount) {
      return toast({
        title: "Error",
        description: "Wallet not found. Please, refresh the page.",
        variant: "destructive",
      });
    }

    const signedDelegation = await createPledgeDelegation({
      delegatorAccount,
      proposalCreatorAddress: creator.walletAddress!,
      attendeeAddress: wallet.address,
      proposalAddress: event.proposalAddress,
      pledgeAmount: values.amount,
    });

    try {
      await createPledge({
        eventId: event.id,
        amount: values.amount,
        delegation: signedDelegation,
      });
      toast({
        title: "Pledge placed successfully",
        description: "Your pledge has been recorded.",
      });
      await Promise.all([
        utils.pledge.placed.invalidate({ eventId: event.id }),
        utils.pledge.valid.invalidate({ eventId: event.id }),
      ]);
      router.refresh();
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <USDCInput type="number" min={event.pledgePrice} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? "Pledging..."
            : `Pledge ${formatCurrency(Number(amount))}`}
        </Button>
      </form>
    </Form>
  );
}
