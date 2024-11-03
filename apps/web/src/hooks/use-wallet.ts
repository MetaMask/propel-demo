import { useQuery } from "@tanstack/react-query";
import { getDelegatorUSDCBalance } from "@/lib/delegator";
import { useDelegator } from "@/providers/delegator";

export function useWallet() {
  const { delegatorAccount } = useDelegator();
  return useQuery({
    queryKey: ["wallet", delegatorAccount?.address],
    queryFn: async () => {
      if (!delegatorAccount) {
        return undefined;
      }
      const balance = await getDelegatorUSDCBalance(delegatorAccount);
      const balanceInUsdc = Number(balance / 1000000n);
      return {
        balance: balanceInUsdc,
        address: delegatorAccount.address,
        account: delegatorAccount,
      };
    },
    enabled: !!delegatorAccount,
  });
}
