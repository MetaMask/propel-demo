import { useQuery } from "@tanstack/react-query";
import { getDelegatorUSDCBalance } from "@/lib/delegator";
import { useDelegator } from "@/providers/delegator";

export function useWallet() {
  const { delegatorClient } = useDelegator();
  return useQuery({
    queryKey: ["wallet", delegatorClient?.account.address],
    queryFn: async () => {
      if (!delegatorClient) {
        return undefined;
      }
      const balance = await getDelegatorUSDCBalance(delegatorClient);
      const balanceInUsdc = Number(balance / 1000000n);

      return {
        balance: balanceInUsdc,
        address: delegatorClient.account.address,
        client: delegatorClient,
      };
    },
    enabled: !!delegatorClient,
  });
}
