import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { getAddress } from "viem";

describe("TemplateContract", function () {
  async function deployTemplateContractFixture() {
    const initialMessage = "Hello, Template!";

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const templateContract = await hre.viem.deployContract("TemplateContract", [
      initialMessage,
    ]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      templateContract,
      initialMessage,
      owner,
      otherAccount,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct initial message", async function () {
      const { templateContract, initialMessage } = await loadFixture(
        deployTemplateContractFixture,
      );

      expect(await templateContract.read.message()).toBe(initialMessage);
    });

    it("Should set the correct owner", async function () {
      const { templateContract, owner } = await loadFixture(
        deployTemplateContractFixture,
      );

      expect(await templateContract.read.owner()).toBe(
        getAddress(owner.account.address),
      );
    });
  });

  describe("Message Updates", function () {
    it("Should allow owner to update message", async function () {
      const { templateContract } = await loadFixture(
        deployTemplateContractFixture,
      );

      const newMessage = "Updated message";
      await templateContract.write.updateMessage([newMessage]);
      expect(await templateContract.read.message()).toBe(newMessage);
    });

    it("Should not allow non-owner to update message", async function () {
      const { templateContract, otherAccount } = await loadFixture(
        deployTemplateContractFixture,
      );

      const boilerplateContractAsOtherAccount = await hre.viem.getContractAt(
        "TemplateContract",
        templateContract.address,
        { client: { wallet: otherAccount } },
      );

      await expect(
        boilerplateContractAsOtherAccount.write.updateMessage(["Unauthorized"]),
      ).rejects.toThrow("Only the owner can call this function");
    });

    it("Should emit MessageUpdated event", async function () {
      const { templateContract, publicClient } = await loadFixture(
        deployTemplateContractFixture,
      );

      const newMessage = "Event test";
      const hash = await templateContract.write.updateMessage([newMessage]);
      await publicClient.waitForTransactionReceipt({ hash });

      const messageUpdatedEvents =
        await templateContract.getEvents.MessageUpdated();
      expect(messageUpdatedEvents).toHaveLength(1);
      expect(messageUpdatedEvents[0].args.newMessage).toBe(newMessage);
    });
  });

  describe("Counter", function () {
    it("Should increment counter", async function () {
      const { templateContract } = await loadFixture(
        deployTemplateContractFixture,
      );

      await templateContract.write.incrementCounter();
      expect(await templateContract.read.counter()).toBe(1n);
    });

    it("Should emit CounterIncremented event", async function () {
      const { templateContract, publicClient } = await loadFixture(
        deployTemplateContractFixture,
      );

      const hash = await templateContract.write.incrementCounter();
      await publicClient.waitForTransactionReceipt({ hash });

      const counterIncrementedEvents =
        await templateContract.getEvents.CounterIncremented();
      expect(counterIncrementedEvents).toHaveLength(1);
      expect(counterIncrementedEvents[0].args.newValue).toBe(1n);
    });
  });

  describe("Contract Info", function () {
    it("Should return correct contract info", async function () {
      const { templateContract, initialMessage, owner } = await loadFixture(
        deployTemplateContractFixture,
      );

      const [message, counter, contractOwner] =
        await templateContract.read.getContractInfo();
      expect(message).toBe(initialMessage);
      expect(counter).toBe(0n);
      expect(contractOwner).toBe(getAddress(owner.account.address));
    });
  });
});
