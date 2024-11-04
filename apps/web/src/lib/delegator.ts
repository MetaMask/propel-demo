import { CHAIN, DELEGATOR_SALT, USDC_ADDRESS } from "@/lib/constants";
import {
  type CaveatStruct,
  type DeleGatorEnvironment,
  createCaveatBuilder,
  getDeleGatorEnvironment,
  Implementation,
  SINGLE_DEFAULT_MODE,
  createRootDelegation,
  type MetaMaskSmartAccount,
  DelegationFramework,
  type ExecutionMode,
  toMetaMaskSmartAccount,
  type ExecutionStruct,
} from "@codefi/delegator-core-viem";
import {
  type Address,
  type Hex,
  concat,
  createClient,
  createPublicClient,
  createWalletClient,
  custom,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  http,
  isAddress,
  keccak256,
  toHex,
  zeroAddress,
} from "viem";

import { env } from "@/env";
import {
  getUSDCAddress,
  PROPOSAL_ID_ENFORCER_ADDRESS,
  PROPOSAL_NFT_ADDRESS,
} from "@/lib/contract";
import type { RouterInputs, RouterOutputs } from "@/trpc/react";
import type { IProvider } from "@web3auth/base";
import { bundlerActions, ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { pimlicoBundlerActions } from "permissionless/actions/pimlico";
import { hardhat, sepolia } from "viem/chains";
import type { Event, Pledge } from "@/lib/types";
import {
  createBundlerClient,
  createPaymasterClient,
} from "viem/account-abstraction";

export const getDelegatorEnv = (chainId: number) => {
  return getDeleGatorEnvironment(
    chainId === hardhat.id ? sepolia.id : chainId,
    "1.1.0",
  );
};

export const getPimlicoClient = () => {
  return createClient({
    transport: http(env.NEXT_PUBLIC_BUNDLER_URL),
    chain: CHAIN,
  })
    .extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))
    .extend(pimlicoBundlerActions(ENTRYPOINT_ADDRESS_V07));
};

export const getBundlerClientAndGasPrice = async () => {
  const pimlicoClient = getPimlicoClient();

  const { fast: feesPerGas } = await pimlicoClient.getUserOperationGasPrice();

  const paymaster = createPaymasterClient({
    transport: http(env.NEXT_PUBLIC_PAYMASTER_URL),
  });

  const bundlerClient = createBundlerClient({
    transport: http(env.NEXT_PUBLIC_BUNDLER_URL),
    chain: CHAIN,
    paymaster,
  });

  return { bundlerClient, feesPerGas };
};

export const generateProposalId = (
  creatorWalletAddress: Address,
  targetFunding: number,
  nonce: bigint,
): `0x${string}` => {
  const encodedData = encodePacked(
    ["address", "uint256", "address", "uint256"],
    [
      creatorWalletAddress,
      BigInt(targetFunding) * 1000000n,
      getUSDCAddress(CHAIN.id),
      nonce,
    ],
  );

  return keccak256(encodedData);
};

function proposalIdBuilder(
  _: DeleGatorEnvironment,
  attendeeAddress: Address,
  proposalAddress: Hex,
): CaveatStruct {
  return {
    enforcer: PROPOSAL_ID_ENFORCER_ADDRESS,
    terms: encodeAbiParameters(
      [{ type: "address" }, { type: "address" }, { type: "bytes32" }],
      [PROPOSAL_NFT_ADDRESS, attendeeAddress, proposalAddress],
    ),
    args: "0x",
  };
}

function erc20TransferAmountBuilder(
  environment: DeleGatorEnvironment,
  tokenAddress: Address,
  maxAmount: bigint,
): CaveatStruct {
  if (!isAddress(tokenAddress, { strict: false })) {
    throw new Error("Invalid tokenAddress: must be a valid address");
  }

  if (maxAmount < 0n) {
    throw new Error("Invalid maxAmount: must be a non-negative number");
  }

  const terms = concat([tokenAddress, toHex(maxAmount, { size: 32 })]);

  const {
    caveatEnforcers: { ERC20TransferAmountEnforcer },
  } = environment;

  return {
    enforcer: ERC20TransferAmountEnforcer!,
    terms,
    args: "0x",
  };
}

export async function createPledgeDelegation({
  delegatorAccount,
  proposalCreatorAddress,
  attendeeAddress,
  proposalAddress,
  pledgeAmount,
}: {
  delegatorAccount: MetaMaskSmartAccount<Implementation>;
  proposalCreatorAddress: Address;
  attendeeAddress: Address;
  proposalAddress: Hex;
  pledgeAmount: number;
}) {
  const caveatBuilder = createCaveatBuilder(delegatorAccount.environment)
    .extend("proposalId", proposalIdBuilder)
    // we add this custom builder as a workaround for this bug https://github.com/MetaMask/delegator-sdk/issues/495
    .extend("erc20TransferAmount-495", erc20TransferAmountBuilder);

  caveatBuilder
    .addCaveat("proposalId", attendeeAddress, proposalAddress)
    .addCaveat("valueLte", 0n)
    .addCaveat("limitedCalls", 1)
    .addCaveat(
      "erc20TransferAmount-495",
      USDC_ADDRESS,
      BigInt(pledgeAmount) * 1000000n,
    );

  const delegation = createRootDelegation(
    proposalCreatorAddress,
    delegatorAccount.address,
    caveatBuilder,
  );

  const signedDelegation = {
    ...delegation,
    signature: await delegatorAccount.signDelegation({ delegation }),
  };

  return signedDelegation;
}

type AwaitUserOpInputs = RouterInputs["event"]["fulfill"];
type AwaitUserOpOutputs = RouterOutputs["event"]["fulfill"];
type AwaitUserOpFn = (inputs: AwaitUserOpInputs) => Promise<AwaitUserOpOutputs>;

export async function closeBids({
  creatorAccount,
  event,
  pledges,
  awaitUserOpFn,
}: {
  creatorAccount: MetaMaskSmartAccount<Implementation>;
  event: Event;
  pledges: Pledge[];
  awaitUserOpFn: AwaitUserOpFn;
}) {
  const pledgers = pledges.map(
    (p) => p.attendeeAddress ?? p.delegation.delegator,
  );

  const targetFunding = event.pledgePrice * event.minTickets;

  const createProposalExecution = {
    target: PROPOSAL_NFT_ADDRESS as Address,
    callData: encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: "_minimumFunding", type: "uint256" },
            { name: "_biddingToken", type: "address" },
            { name: "_nonce", type: "uint256" },
          ],
          name: "createProposal",
          outputs: [{ name: "", type: "bytes32" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      functionName: "createProposal",
      args: [
        BigInt(targetFunding) * 1000000n,
        getUSDCAddress(CHAIN.id),
        event.nonce,
      ],
    }),
    value: 0n,
  };

  const closeBidsExecution = {
    target: PROPOSAL_NFT_ADDRESS as Address,
    callData: encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: "proposalId", type: "bytes32" },
            { name: "bidders", type: "address[]" },
          ],
          name: "closeBids",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      functionName: "closeBids",
      args: [event.proposalAddress, pledgers],
    }),
    value: 0n,
  };

  const delegationArrays = pledges.map((p) => [p.delegation]);
  const modes: ExecutionMode[] = pledges.map((_) => SINGLE_DEFAULT_MODE);
  const executions: ExecutionStruct[][] = pledges.map((p) => {
    const withdrawCalldata = encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          name: "transfer",
          outputs: [{ name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      functionName: "transfer",
      args: [creatorAccount.address, BigInt(p.amount) * 1000000n],
    });

    return [
      {
        target: USDC_ADDRESS,
        callData: withdrawCalldata,
        value: 0n,
      },
    ];
  });

  const redeemDelegationsCalldata =
    DelegationFramework.encode.redeemDelegations(
      [...delegationArrays, [], []],
      [...modes, SINGLE_DEFAULT_MODE, SINGLE_DEFAULT_MODE],
      [...executions, [createProposalExecution], [closeBidsExecution]],
    );

  const { bundlerClient, feesPerGas } = await getBundlerClientAndGasPrice();

  const userOpHash = await bundlerClient.sendUserOperation({
    account: creatorAccount,
    calls: [
      {
        to: creatorAccount.address,
        data: redeemDelegationsCalldata,
      },
    ],
    ...feesPerGas,
  });

  const receipt = await awaitUserOpFn({
    id: event.id,
    pledges: pledges.map((p) => p.id),
    hash: userOpHash,
  });

  console.log("UserOp receipt:", receipt);

  return receipt;
}

export const getDelegatorUSDCBalance = async (
  account?: MetaMaskSmartAccount<Implementation>,
) => {
  if (!account) {
    throw new Error("No account provided");
  }

  const addr = account.address;

  const publicClient = createPublicClient({
    chain: CHAIN,
    transport: http(env.NEXT_PUBLIC_CHAIN_URL),
  });

  const bb = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: [
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: [addr],
  });

  return bb;
};

export const getUSDCBalance = async (address: Address) => {
  const publicClient = createPublicClient({
    chain: CHAIN,
    transport: http(env.NEXT_PUBLIC_CHAIN_URL),
  });

  const bb = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: [
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: [address],
  });

  return bb;
};

export const getMetaMaskSmartAccountFromProvider = async (
  provider: IProvider,
): Promise<MetaMaskSmartAccount<Implementation>> => {
  const [owner] = (await provider.request({
    method: "eth_accounts",
  })) as Address[];

  if (!owner) {
    throw new Error("Can't find provider's owner account");
  }

  const walletClient = createWalletClient({
    chain: CHAIN,
    transport: custom(provider),
    account: owner,
  });

  const publicClient = createPublicClient({
    chain: CHAIN,
    transport: custom(provider),
  });

  const account = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [owner, [], [], []],
    signatory: { walletClient },
    deploySalt: DELEGATOR_SALT,
    environment: getDelegatorEnv(CHAIN.id),
  });

  const isGatorDeployed = await account.isDeployed();

  console.log("isGatorDeployed:", isGatorDeployed);

  if (!isGatorDeployed) {
    console.log("Deploying gator...");
    const { bundlerClient, feesPerGas } = await getBundlerClientAndGasPrice();

    const userOpHash = await bundlerClient.sendUserOperation({
      account,
      calls: [
        {
          to: zeroAddress,
          data: "0x",
          value: 0n,
        },
      ],
      ...feesPerGas,
    });

    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
      timeout: 30_000,
    });

    if (!receipt.success) {
      throw new Error("UserOperation failed: " + receipt.reason);
    }

    console.log("UserOperation settled", {
      userOpHash,
      actualGasUsed: receipt.actualGasUsed,
    });
    console.log("Gator deployed!");
  }

  return account;
};

export const withdrawUSDC = async (
  account: MetaMaskSmartAccount<Implementation>,
  to: Address,
  amount: number,
) => {
  const rawAmount = BigInt(amount) * 1000000n;

  const withdrawCalldata = encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    functionName: "transfer",
    args: [to, rawAmount],
  });

  const { bundlerClient, feesPerGas } = await getBundlerClientAndGasPrice();

  const userOpHash = await bundlerClient.sendUserOperation({
    account,
    calls: [
      {
        to: USDC_ADDRESS,
        data: withdrawCalldata,
      },
    ],
    ...feesPerGas,
  });

  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
    timeout: 30_000,
  });

  if (!receipt.success) {
    throw new Error("UserOperation failed: " + receipt.reason);
  }

  console.log("UserOperation settled", {
    userOpHash,
    actualGasUsed: receipt.actualGasUsed,
  });
};
