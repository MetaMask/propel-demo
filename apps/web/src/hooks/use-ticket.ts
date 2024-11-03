import { useQuery } from "@tanstack/react-query";
import { getProposalNFTs } from "@/lib/proposalNFT";
import { useWallet } from "@/hooks/use-wallet";

interface UseTicketProps {
  proposalId: string;
}

interface TicketData {
  hasTicket: boolean | null;
}

async function fetchTicketData(
  walletAddress: string,
  proposalId: string,
): Promise<TicketData> {
  if (!walletAddress) {
    return { hasTicket: null };
  }
  const nfts = await getProposalNFTs(walletAddress as `0x${string}`);
  const hasTicket = nfts.some((nft) => nft.proposalId === proposalId);
  return { hasTicket };
}

export function useTicket({ proposalId }: UseTicketProps) {
  const { data: wallet } = useWallet();

  return useQuery({
    queryKey: ["ticket", wallet?.address, proposalId],
    queryFn: () => fetchTicketData(wallet!.address, proposalId),
    initialData: { hasTicket: null },
    enabled: !!wallet,
  });
}
