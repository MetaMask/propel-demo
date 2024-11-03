import { env } from "@/env";
import { type Address } from "viem";
import { CHAIN, USDC_ADDRESS } from "./constants";
import { numberToUSDC } from "./utils";

export interface DaimoResponse {
  id: string;
  url: string;
}

const generateIdempotencyKey = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `${timestamp}-${randomStr}`;
};

export const generatePayment = async ({
  amount,
  address,
  redirectUri,
}: {
  amount: number;
  address: Address;
  redirectUri: string;
}): Promise<DaimoResponse> => {
  const idempotencyKey = generateIdempotencyKey();
  console.log(CHAIN.id);
  console.log(USDC_ADDRESS);

  const response = await fetch("https://pay.daimo.com/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "Api-Key": env.DAIMO_API_KEY,
    },
    body: JSON.stringify({
      intent: "Deposit",
      items: [
        {
          name: "Linea USDC",
          description: "Deposit Linea USDC to your Propel wallet",
          image:
            "https://lineascan.build/assets/linea/images/svg/logos/chain-light.svg",
        },
      ],
      recipient: {
        address,
        amount: numberToUSDC(amount),
        token: USDC_ADDRESS,
        chain: CHAIN.id,
      },
      userCanSetPrice: true,
      paymentOptions: [],
      redirectUri,
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error: string };
    throw new Error(
      `Unable to generate daimo payment: ${response.status} ${response.statusText}: ${error.error}`,
    );
  }

  const data = (await response.json()) as DaimoResponse;
  return data;
};
