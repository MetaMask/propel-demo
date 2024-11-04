"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Address } from "viem";
import { z } from "zod";
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
import { ArrowUpRightIcon } from "lucide-react";
import { withdrawUSDC } from "@/lib/delegator";
import { useWallet } from "@/hooks/use-wallet";

const formSchema = z.object({
  address: z.custom<string>(
    (v) => typeof v === "string" && v.startsWith("0x") && v.length === 42,
    "Invalid address",
  ),
});

function WithdrawFundsForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
    },
  });
  const { data: wallet } = useWallet();

  const handleWithdraw = async (address: Address) => {
    console.log(`Withdrawing funds to ${address}`);
    if (!wallet) {
      console.error("No delegator account found");
      return;
    }
    console.log("Withdrawing", wallet.balance);
    await withdrawUSDC(wallet.account, address, wallet.balance);
    console.log("Withdrawal complete");
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await handleWithdraw(values.address as Address);
      form.reset();
    } catch (error) {
      console.error("Failed to withdraw funds:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wallet Address</FormLabel>
              <FormControl>
                <Input placeholder="0x..." data-1p-ignore {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="mt-4 flex flex-col space-y-2">
          <Button
            type="submit"
            className=""
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Processing..." : "Withdraw Funds"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function WithdrawFundsButton() {
  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button className="w-full" variant="outline">
          <ArrowUpRightIcon className="mr-2.5 h-6 w-6" /> Withdraw
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle className="text-left">Withdraw</CredenzaTitle>
          <CredenzaDescription className="text-left">
            Enter the wallet address where you&apos;d like to withdraw your
            funds.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <WithdrawFundsForm />
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
