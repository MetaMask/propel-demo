import type { Abi, Address } from "viem";
import { mainnet, sepolia, type Chain } from "viem/chains";
import { hardhat, linea, lineaSepolia } from "viem/chains";
import deployedContracts from "@/contracts/deployedContracts";
import { env } from "@/env";

export type InheritedFunctions = Readonly<Record<string, string>>;

export type GenericContract = {
  address: Address;
  abi: Abi;
  value?: bigint;
  inheritedFunctions?: InheritedFunctions;
  external?: true;
};

export type GenericContractsDeclaration = Record<
  number,
  Record<string, GenericContract>
>;

export type ValidChainId = keyof typeof deployedContracts;

export function getChainById(chainId?: number): Chain {
  switch (chainId) {
    case hardhat.id:
      return hardhat;
    case mainnet.id:
      return mainnet;
    case sepolia.id:
      return sepolia;
    case lineaSepolia.id:
      return lineaSepolia;
    case linea.id:
      return linea;
    default:
      throw new Error(`Unsupported chainId: ${chainId}`);
  }
}

export function getUSDCAddress(chainId: number): Address {
  switch (chainId) {
    case hardhat.id:
    case sepolia.id:
      return "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
    case mainnet.id:
      return "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    case lineaSepolia.id:
      return "0xB4F9b6b019E75CBe51af4425b2Fc12797e2Ee2a1";
    case linea.id:
      return "0x176211869cA2b568f2A7D4EE941E073a821EE1ff";
    default:
      throw new Error(`Unsupported chainId: ${chainId}`);
  }
}

export const PROPOSAL_NFT_ADDRESS =
  deployedContracts[env.NEXT_PUBLIC_CHAIN_ID].ProposalNFT.address;

export const PROPOSAL_ID_ENFORCER_ADDRESS =
  deployedContracts[env.NEXT_PUBLIC_CHAIN_ID].ProposalIdEnforcer.address;
