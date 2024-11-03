import * as dotenv from "dotenv";
dotenv.config({
  path: "../../.env",
});

import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-viem";
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-foundry";
import "hardhat-deploy";
import "hardhat-jest";

const providerApiKey = process.env.INFURA_API_KEY ?? "";

// If not set, it uses the hardhat account 0 private key.
const deployerPrivateKey =
  process.env.DEPLOYER_PRIVATE_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// If not set, it uses a default Etherscan API key.
const etherscanApiKey =
  process.env.ETHERSCAN_API_KEY || "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        // https://docs.soliditylang.org/en/latest/using-the-compiler.html#optimizer-options
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./src",
    deploy: "./deploy",
    deployments: "./deployments",
    tests: "./test",
  },
  namedAccounts: {
    deployer: {
      // By default, it will take the first Hardhat account as the deployer
      default: 0,
    },
  },
  defaultNetwork: "localhost",
  networks: {
    // View the networks that are pre-configured.
    // If the network you are looking for is not here you can add new network settings
    localhost: {
      chainId: 31337,
      accounts: [deployerPrivateKey],
    },
    hardhat: {
      forking: {
        url: `https://sepolia.infura.io/v3/${providerApiKey}`,
        enabled: true,
      },
    },
    mainnet: {
      chainId: 1,
      url: `https://mainnet.infura.io/v3/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    sepolia: {
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    linea: {
      chainId: 59144,
      url: `https://linea-mainnet.infura.io/v3/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    lineaSepolia: {
      chainId: 59141,
      url: `https://linea-sepolia.infura.io/v3/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
  },
  // configuration for harhdat-verify plugin
  etherscan: {
    apiKey: `${etherscanApiKey}`,
  },
  // configuration for etherscan-verify from hardhat-deploy plugin
  verify: {
    etherscan: {
      apiKey: `${etherscanApiKey}`,
    },
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
