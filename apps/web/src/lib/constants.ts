import { getChainById, getUSDCAddress } from "@/lib/contract";
import { env } from "@/env";
import { Status } from "@/lib/types";
import deployedContracts from "@/contracts/deployedContracts";

export const CHAIN = getChainById(env.NEXT_PUBLIC_CHAIN_ID);

export const USDC_ADDRESS = getUSDCAddress(CHAIN.id);

export const DELEGATOR_SALT = "0x";

export const statusColors = {
  [Status.ACTIVE]: "bg-green-500 text-white",
  [Status.PENDING]: "bg-yellow-500 text-white",
  [Status.COMPLETED]: "bg-blue-500 text-white",
  [Status.CANCELED]: "bg-red-500 text-white",
  [Status.EXPIRED]: "bg-gray-500 text-white",
};

export const PROPOSAL_NONCE = BigInt(0);

export const PROPOSAL_NFT_ADDRESS =
  deployedContracts[env.NEXT_PUBLIC_CHAIN_ID].ProposalNFT.address;

export const DEFAULT_MIN_TICKETS = 1;
export const DEFAULT_MAX_TICKETS = 100;
export const PROPOSAL_NAME_MAX_LENGTH = 50;
export const LOCATION_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 2000;
export const TIMEZONE = "Asia/Bangkok";
