import { CHAIN, DELEGATOR_SALT, USDC_ADDRESS } from "@/lib/constants";
import {
  type DeleGatorClient,
  type CaveatStruct,
  type DeleGatorEnvironment,
  createCaveatBuilder,
  createDeleGatorClient,
  getDeleGatorEnvironment,
  Implementation,
  type Redemption,
  SINGLE_DEFAULT_MODE,
  createRootDelegation,
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
import {
  pimlicoBundlerActions,
  pimlicoPaymasterActions,
} from "permissionless/actions/pimlico";
import { hardhat, sepolia } from "viem/chains";
import type { Event, Pledge } from "@/lib/types";

export const getDelegatorEnv = (chainId: number) => {
  return getDeleGatorEnvironment(
    chainId === hardhat.id ? sepolia.id : chainId,
    "1.1.0",
  );
};

export const getBundlerClient = () => {
  const bundler = createClient({
    transport: http(env.NEXT_PUBLIC_BUNDLER_URL),
    chain: CHAIN,
  })
    .extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))
    .extend(pimlicoBundlerActions(ENTRYPOINT_ADDRESS_V07));

  return bundler;
};

const getPaymasterClient = () => {
  const paymaster = createClient({
    transport: http(env.NEXT_PUBLIC_PAYMASTER_URL),
    chain: CHAIN,
  }).extend(pimlicoPaymasterActions(ENTRYPOINT_ADDRESS_V07));

  return paymaster;
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
  client,
  proposalCreatorAddress,
  attendeeAddress,
  proposalAddress,
  pledgeAmount,
}: {
  client: DeleGatorClient;
  proposalCreatorAddress: Address;
  attendeeAddress: Address;
  proposalAddress: Hex;
  pledgeAmount: number;
}) {
  const caveatBuilder = createCaveatBuilder(client.account.environment)
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
    client.account.address,
    caveatBuilder,
  );

  const signedDelegation = await client.signDelegation(delegation);

  return signedDelegation;
}

type AwaitUserOpInputs = RouterInputs["event"]["fulfill"];
type AwaitUserOpOutputs = RouterOutputs["event"]["fulfill"];
type AwaitUserOpFn = (inputs: AwaitUserOpInputs) => Promise<AwaitUserOpOutputs>;

export async function closeBids({
  creatorGatorClient,
  event,
  pledges,
  awaitUserOpFn,
}: {
  creatorGatorClient: DeleGatorClient;
  event: Event;
  pledges: Pledge[];
  awaitUserOpFn: AwaitUserOpFn;
}) {
  const pledgers = pledges.map(
    (p) => p.attendeeAddress ?? p.delegation.delegator,
  );

  const redemptions: Redemption[] = [];

  const targetFunding = event.pledgePrice * event.minTickets;

  // Create ProposalNFT execution
  const createProposalCalldata = encodeFunctionData({
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
  });

  const createProposalExecution = {
    target: PROPOSAL_NFT_ADDRESS as Address,
    callData: createProposalCalldata,
    value: 0n,
  };

  // Close bids execution
  const closeBidsCalldata = encodeFunctionData({
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
  });

  const closeBidsExecution = {
    target: PROPOSAL_NFT_ADDRESS as Address,
    callData: closeBidsCalldata,
    value: 0n,
  };

  const withdrawRedemptions: Redemption[] = [];

  for (const pledge of pledges) {
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
      args: [
        creatorGatorClient.account.address,
        BigInt(pledge.amount) * 1000000n,
      ],
    });

    withdrawRedemptions.push({
      permissionContext: [pledge.delegation],
      executions: [
        {
          target: USDC_ADDRESS,
          callData: withdrawCalldata,
          value: 0n,
        },
      ],
      mode: SINGLE_DEFAULT_MODE,
    });
  }

  redemptions.push({
    permissionContext: [],
    executions: [createProposalExecution],
    mode: SINGLE_DEFAULT_MODE,
  });

  redemptions.push({
    permissionContext: [],
    executions: [closeBidsExecution],
    mode: SINGLE_DEFAULT_MODE,
  });

  redemptions.push(...withdrawRedemptions);

  const bundler = getBundlerClient();
  const { fast } = await bundler.getUserOperationGasPrice();

  const userOp = await creatorGatorClient.createRedeemDelegationsUserOp(
    redemptions,
    fast,
  );

  const paymaster = getPaymasterClient();

  console.log("Estimating useroperation gas...");

  const gasEstimate = await bundler.estimateUserOperationGas({
    userOperation: userOp,
  });
  console.log("Gas estimate:", gasEstimate);

  const sponsorship = await paymaster.sponsorUserOperation({
    userOperation: userOp,
  });

  const signedUserOperation = await creatorGatorClient.signUserOp({
    ...userOp,
    ...sponsorship,
  });

  const userOpHash = await bundler.sendUserOperation({
    userOperation: signedUserOperation,
  });

  console.log("UserOp hash:", userOpHash);

  const receipt = await awaitUserOpFn({
    id: event.id,
    pledges: pledges.map((p) => p.id),
    hash: userOpHash,
  });
  console.log("UserOp receipt:", receipt);

  return receipt;
}

export const getDelegatorUSDCBalance = async (
  client: DeleGatorClient | null,
) => {
  if (!client) {
    throw new Error("No client provided");
  }

  const addr = client.account.address;

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

export const getDelegatorClientFromProvider = async (
  provider: IProvider,
): Promise<DeleGatorClient> => {
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

  const client = createDeleGatorClient({
    transport: http(env.NEXT_PUBLIC_CHAIN_URL),
    chain: CHAIN,
    account: {
      implementation: Implementation.Hybrid,
      deployParams: [owner, [], [], []],
      isAccountDeployed: false,
      signatory: walletClient,
      deploySalt: DELEGATOR_SALT,
    },
    environment: getDelegatorEnv(CHAIN.id),
  });

  const isGatorDeployed = !!(await publicClient.getCode({
    address: client.account.address,
  }));

  console.log("isGatorDeployed:", isGatorDeployed);

  if (!isGatorDeployed) {
    console.log("Deploying gator...");
    const bundler = getBundlerClient();
    const paymaster = getPaymasterClient();

    const { fast } = await bundler.getUserOperationGasPrice();

    const userOp = await client.createExecuteUserOp(
      {
        target: zeroAddress,
        callData: "0x",
        value: 0n,
      },
      fast,
    );

    console.log("Estimating useroperation gas...");

    const gasEstimate = await bundler.estimateUserOperationGas({
      userOperation: userOp,
    });
    console.log("Gas estimate:", gasEstimate);

    const sponsorship = await paymaster.sponsorUserOperation({
      userOperation: userOp,
    });

    const signedUserOperation = await client.signUserOp({
      ...userOp,
      ...sponsorship,
    });

    const userOpHash = await bundler.sendUserOperation({
      userOperation: signedUserOperation,
    });

    const receipt = await bundler.waitForUserOperationReceipt({
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

  return client.toDeployedClient();
};

export const withdrawUSDC = async (
  client: DeleGatorClient,
  to: Address,
  amount: number,
) => {
  const rawAmount = BigInt(amount) * 1000000n;

  const bundler = getBundlerClient();
  const paymaster = getPaymasterClient();

  const { fast } = await bundler.getUserOperationGasPrice();

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

  const userOp = await client.createRedeemDelegationsUserOp(
    [
      {
        permissionContext: [],
        executions: [
          {
            target: USDC_ADDRESS,
            callData: withdrawCalldata,
            value: 0n,
          },
        ],
        mode: SINGLE_DEFAULT_MODE,
      },
    ],
    fast,
  );

  console.log("Estimating useroperation gas...");

  const gasEstimate = await bundler.estimateUserOperationGas({
    userOperation: userOp,
  });
  console.log("Gas estimate:", gasEstimate);

  const sponsorship = await paymaster.sponsorUserOperation({
    userOperation: userOp,
  });

  const signedUserOperation = await client.signUserOp({
    ...userOp,
    ...sponsorship,
  });

  const userOpHash = await bundler.sendUserOperation({
    userOperation: signedUserOperation,
  });

  const receipt = await bundler.waitForUserOperationReceipt({
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
