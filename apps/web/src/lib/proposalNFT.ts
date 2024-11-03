import { createPublicClient, http, type Address } from "viem";
import { CHAIN, PROPOSAL_NFT_ADDRESS } from "@/lib/constants";

export async function getProposalNFTs(walletAddress: Address) {
  const publicClient = createPublicClient({
    chain: CHAIN,
    transport: http(),
  });

  // Get the balance of NFTs for the wallet
  const balance = await publicClient.readContract({
    address: PROPOSAL_NFT_ADDRESS,
    abi: [
      {
        inputs: [{ name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: [walletAddress],
  });

  const nfts = [];

  // Fetch each NFT owned by the wallet
  for (let i = 0; i < balance; i++) {
    const tokenId = await publicClient.readContract({
      address: PROPOSAL_NFT_ADDRESS,
      abi: [
        {
          inputs: [
            { name: "owner", type: "address" },
            { name: "index", type: "uint256" },
          ],
          name: "tokenOfOwnerByIndex",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "tokenOfOwnerByIndex",
      args: [walletAddress, BigInt(i)],
    });

    const proposalId = await publicClient.readContract({
      address: PROPOSAL_NFT_ADDRESS,
      abi: [
        {
          inputs: [{ name: "tokenId", type: "uint256" }],
          name: "getProposalId",
          outputs: [{ name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "getProposalId",
      args: [tokenId],
    });

    if (!proposalId || proposalId === (proposalId as string)) {
      nfts.push({
        tokenId: tokenId.toString(),
        proposalId: proposalId as string,
      });
    }
  }

  return nfts;
}
