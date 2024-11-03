import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const INITIAL_MESSAGE = process.env.INITIAL_MESSAGE ?? "Hello, Boilerplate!";

/**
 * Deploys the BoilerplateContract using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployTemplateContract: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const chainId = hre.network.config.chainId;

  console.log(`Deploying TemplateContract to chain ID: ${chainId}`);
  console.log(`Deployer address: ${deployer}`);
  console.log(`Initial message: ${INITIAL_MESSAGE}`);

  const proposalNFT = await deploy("ProposalNFT", {
    from: deployer,
    args: ["Proposal NFT", "PROPOSAL"],
    log: true,
  });

  const proposalIdEnforcer = await deploy("ProposalIdEnforcer", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`ProposalNFT deployed to: ${proposalNFT.address}`);
  console.log(`ProposalIdEnforcer deployed to: ${proposalIdEnforcer.address}`);
};

export default deployTemplateContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. hardhat deploy --tags Boilerplate
deployTemplateContract.tags = ["Template"];
