import type { GenericContractsDeclaration } from "@/lib/contract";
import deployedLocalContracts from "@/contracts/deployedLocalContracts";
import deployedLiveContracts from "@/contracts/deployedLiveContracts";

const deployedContracts = {
  ...deployedLocalContracts,
  ...deployedLiveContracts,
} as const;

export default deployedContracts satisfies GenericContractsDeclaration;
