"use client";

import { env } from "@/env";
import { CHAIN } from "@/lib/constants";
import { WagmiProvider as WagmiProviderBase } from "wagmi";
import { http, createConfig } from "wagmi";
import { getDefaultConfig } from "@daimo/pay";

/* export const config = createConfig({
  chains: [CHAIN],
  transports: {
    [CHAIN.id]: http(env.NEXT_PUBLIC_CHAIN_URL),
  },
}); */

const daimoConfig = createConfig(
  getDefaultConfig({
    appName: "Propel",
    chains: [CHAIN],
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    transports: {
      [CHAIN.id]: http(env.NEXT_PUBLIC_CHAIN_URL),
    },
    ssr: true,
  }),
);

export const WagmiProvider = ({ children }: { children: React.ReactNode }) => {
  return <WagmiProviderBase config={daimoConfig}>{children}</WagmiProviderBase>;
};
