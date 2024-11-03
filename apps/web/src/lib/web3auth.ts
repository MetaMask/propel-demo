import { CHAIN_NAMESPACES } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, type Web3AuthOptions } from "@web3auth/single-factor-auth";
import { toHex } from "viem";
import { CHAIN } from "@/lib/constants";
import { env } from "@/env";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: toHex(CHAIN.id),
  rpcTarget: env.NEXT_PUBLIC_CHAIN_URL,
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

export const web3authOptions: Web3AuthOptions = {
  clientId: env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
  web3AuthNetwork: env.NEXT_PUBLIC_WEB3AUTH_NETWORK,
  privateKeyProvider,
  enableLogging: true,
  sessionTime: 86400 * 7, // 7 days
};

export const web3auth = new Web3Auth(web3authOptions);
