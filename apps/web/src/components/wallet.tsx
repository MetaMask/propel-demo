"use client";

import { useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { Button, buttonVariants } from "@/components/ui/button";
import { WithdrawFundsButton } from "@/components/withdraw-funds";
import { useWallet } from "@/hooks/use-wallet";
import { cn, formatCurrency } from "@/lib/utils";
import { ArrowDownLeftIcon, FlaskConical, WalletIcon } from "lucide-react";
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
import { DaimoDepositDrawer } from "@/components/deposit-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { LineaIcon } from "@/components/icons";
import { AddressCopyButton } from "@/components/address-copy-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SignedIn } from "@clerk/nextjs";

type WalletProps = {
  enableDaimo: boolean;
};

export function Wallet(props: WalletProps) {
  const [open, setOpen] = useState(false);
  const { data: wallet, isLoading, refetch } = useWallet();

  if (!wallet) {
    return (
      <SignedIn>
        <Button variant="outline" className="flex gap-2 text-sm font-medium">
          <WalletIcon className="h-4 w-4" />
          <p>Loading...</p>
        </Button>
      </SignedIn>
    );
  }

  const onOpenChange = async (open: boolean) => {
    setOpen(open);
    if (open) {
      void refetch();
    }
  };

  const BalanceDisplay = () => {
    if (isLoading) {
      return <Skeleton className="h-6 w-24" />;
    }
    return (
      <span className="text-sm font-medium">
        {formatCurrency(wallet.balance)}
      </span>
    );
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button variant="outline" className="flex gap-2 text-sm font-medium">
          <WalletIcon className="h-4 w-4" />
          {!!wallet.balance ? (
            <>
              <BalanceDisplay />
            </>
          ) : (
            "Add funds"
          )}
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle className="text-left">Account Balance</CredenzaTitle>
          <CredenzaDescription className="text-left">
            To pledge with Propel, you need USDC (Linea).
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-lg font-bold">
              <span>{formatCurrency(wallet.balance)}</span>
              <LineaIcon />
            </div>
            <div className="flex gap-4">
              <WithdrawFundsButton />
              <AddFundsButton enableDaimo={props.enableDaimo} />
            </div>
          </div>
        </CredenzaBody>
        <CredenzaFooter>
          <CredenzaClose asChild className="md:hidden">
            <Button variant="outline">Close</Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}

type AddFundsButtonProps = {
  enableDaimo: boolean;
};

function AddFundsButton(props: AddFundsButtonProps) {
  const { data: wallet, isLoading } = useWallet();

  if (!wallet) {
    return null;
  }

  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button className="w-full" disabled={isLoading}>
          <ArrowDownLeftIcon className="mr-2.5 h-6 w-6" /> Add Funds
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle className="text-left">Add Funds</CredenzaTitle>
          <CredenzaDescription className="text-left">
            Fund your Propel account below. You can add funds by transferring
            USDC (Linea) from a wallet or requesting a friend.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-4">
              <QRCode
                value={wallet.address}
                className="rounded-lg"
                size={220}
              />
              <AddressCopyButton address={wallet.address} />
            </div>
            <Alert variant="destructive">
              <AlertDescription>
                Only transfer the USDC token of Linea. Tokens sent from another
                chain will be lost.
              </AlertDescription>
            </Alert>
          </div>
        </CredenzaBody>
        <CredenzaFooter className="flex flex-col sm:flex-col sm:items-start sm:space-x-0">
          {props.enableDaimo && (
            <p className="-mb-4 text-sm md:-mb-3">
              Bridge from other chains?
              <DaimoDepositDrawer>
                <Button
                  variant="link"
                  size="sm"
                  className="px-2 text-sm text-[#0476C9]"
                >
                  Try out Daimo <FlaskConical className="ml-1 h-3 w-3" />
                </Button>
              </DaimoDepositDrawer>
            </p>
          )}
          <p className="text-sm">
            New to crypto?
            <Link
              href="https://portfolio.metamask.io/buy"
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "px-2 text-sm text-[#0476C9]",
              )}
            >
              Buy with MetaMask
            </Link>
          </p>
          <CredenzaClose asChild className="sm:w-full md:hidden">
            <Button variant="outline">Close</Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
