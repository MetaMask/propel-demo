"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type DaimoResponse } from "@/lib/daimo";
import { buildDaimoRedirectUrl, cn, formatCurrency } from "@/lib/utils";
import { useDelegator } from "@/providers/delegator";
import { api } from "@/trpc/react";
import { debounce } from "lodash";
import { DollarSign, ExternalLinkIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, useRef, useState } from "react";
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
} from "./credenza";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { LineaIcon } from "./icons";

type DaimoDepositDrawerProps = {
  children?: React.ReactNode;
};

export function DaimoDepositDrawer({ children }: DaimoDepositDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [payment, setPayment] = useState<DaimoResponse | null>(null);
  const [onFocus, setOnFocus] = useState(false);
  const { delegatorAccount } = useDelegator();
  const { toast } = useToast();
  const { mutateAsync: generatePayment } =
    api.daimo.generatePayment.useMutation();

  const debouncedGeneratePaymentId = useRef(
    debounce(async (amount: number) => {
      try {
        if (!delegatorAccount) {
          throw new Error("No delegator client found");
        }
        const payment = await generatePayment({
          amount,
          redirectUri: buildDaimoRedirectUrl(),
        });
        setPayment(payment);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error generating payment ID",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 1000),
  ).current;

  if (!delegatorAccount) {
    return null;
  }

  const handleDeposit = (e: ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const newAmount = e.target.value;
    setAmount(newAmount);
    setPayment(null);

    const numericAmount = Number(newAmount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      return debouncedGeneratePaymentId(numericAmount);
    }
    setIsLoading(false);
  };

  const content = (
    <div className="flex flex-col gap-2">
      <Label>Amount (USDC)</Label>
      <div
        className={cn(
          "mb-2 flex items-center gap-1 rounded-md border border-input p-2",
          onFocus ? "ring-2 ring-ring" : "",
        )}
      >
        <DollarSign className="h-4 w-4" />
        <Input
          type="number"
          placeholder="0"
          value={amount}
          onChange={handleDeposit}
          min={1}
          onFocus={() => setOnFocus(true)}
          onBlur={() => setOnFocus(false)}
          className="h-7 border-none p-0 text-lg focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="text-sm font-bold">USDC</span>
          <LineaIcon />
        </div>
      </div>
      {/*       {payment?.id && (
        <DaimoPayButton payId={payment.id} mode="light" theme="soft" />
      )} */}
      {!payment || isLoading || !payment?.url ? (
        <Button disabled className={cn(isLoading && "animate-pulse")}>
          Deposit {formatCurrency(Number(amount) || 0)}
          {isLoading && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      ) : (
        <Link href={payment?.url ?? ""} target="_blank" className="w-full">
          <Button
            disabled={!amount || Number(amount) <= 0 || isLoading}
            className="flex w-full items-center justify-center gap-2"
          >
            <span>Deposit {formatCurrency(Number(amount) || 0)}</span>
            <ExternalLinkIcon className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <Credenza>
      <CredenzaTrigger asChild>{children}</CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle className="text-left">Deposit</CredenzaTitle>
          <CredenzaDescription className="text-left">
            Deposit enough funds to utilize Propel during your Edge Lanna stay.
            This is a temporary experience, so don&apos;t add more than you
            intend to use. You can withdraw your funds at anytime.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>{content}</CredenzaBody>
        <CredenzaFooter>
          <CredenzaClose asChild>
            <Button variant="outline">Close</Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
