const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Wallet Management Integration", function () {
  let devWallet;
  let endowmentWallet;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy DevWallet contract
    const DevWallet = await ethers.getContractFactory("DevWallet");
    devWallet = await DevWallet.deploy();
    await devWallet.waitForDeployment();

    // Deploy EndowmentWallet contract
    const EndowmentWallet = await ethers.getContractFactory("EndowmentWallet");
    endowmentWallet = await EndowmentWallet.deploy();
    await endowmentWallet.waitForDeployment();
  });

  describe("DevWallet Integration", function () {
    it("Should allow adding and managing wallets through the new interface", async function () {
      // Add a wallet
      await expect(
        devWallet.addWallet(
          addr1.address,
          "Dev Team Member 1",
          "First dev team member wallet"
        )
      )
        .to.emit(devWallet, "WalletAdded")
        .withArgs(addr1.address, "Dev Team Member 1");

      // Check that the wallet was added
      const walletAddresses = await devWallet.getWalletAddresses();
      expect(walletAddresses.length).to.equal(1);
      expect(walletAddresses[0]).to.equal(addr1.address);

      // Check wallet info
      const walletInfo = await devWallet.getWalletInfo(addr1.address);
      expect(walletInfo[0]).to.equal("Dev Team Member 1"); // name
      expect(walletInfo[1]).to.equal("First dev team member wallet"); // description
      expect(walletInfo[2]).to.equal(true); // isActive

      // Update wallet
      await expect(
        devWallet.updateWallet(
          addr1.address,
          "Updated Dev Team Member 1",
          "Updated description"
        )
      )
        .to.emit(devWallet, "WalletUpdated")
        .withArgs(addr1.address, "Updated Dev Team Member 1");

      // Check updated info
      const updatedWalletInfo = await devWallet.getWalletInfo(addr1.address);
      expect(updatedWalletInfo[0]).to.equal("Updated Dev Team Member 1"); // name
      expect(updatedWalletInfo[1]).to.equal("Updated description"); // description
      expect(updatedWalletInfo[2]).to.equal(true); // isActive

      // Deactivate wallet
      await expect(
        devWallet.deactivateWallet(addr1.address)
      )
        .to.emit(devWallet, "WalletDeactivated")
        .withArgs(addr1.address);

      // Check that the wallet is deactivated
      const deactivatedWalletInfo = await devWallet.getWalletInfo(addr1.address);
      expect(deactivatedWalletInfo[2]).to.equal(false); // isActive

      // Activate wallet
      await expect(
        devWallet.activateWallet(addr1.address)
      )
        .to.emit(devWallet, "WalletActivated")
        .withArgs(addr1.address);

      // Check that the wallet is activated
      const activatedWalletInfo = await devWallet.getWalletInfo(addr1.address);
      expect(activatedWalletInfo[2]).to.equal(true); // isActive

      // Remove wallet
      await expect(
        devWallet.removeWallet(addr1.address)
      )
        .to.emit(devWallet, "WalletRemoved")
        .withArgs(addr1.address);

      // Check that the wallet was removed
      const finalWalletAddresses = await devWallet.getWalletAddresses();
      expect(finalWalletAddresses.length).to.equal(0);
    });
  });

  describe("EndowmentWallet Integration", function () {
    it("Should allow adding and managing wallets through the new interface", async function () {
      // Add a wallet
      await expect(
        endowmentWallet.addWallet(
          addr1.address,
          "Endowment Recipient 1",
          "First endowment recipient wallet"
        )
      )
        .to.emit(endowmentWallet, "WalletAdded")
        .withArgs(addr1.address, "Endowment Recipient 1");

      // Check that the wallet was added
      const walletAddresses = await endowmentWallet.getWalletAddresses();
      expect(walletAddresses.length).to.equal(1);
      expect(walletAddresses[0]).to.equal(addr1.address);

      // Check wallet info
      const walletInfo = await endowmentWallet.getWalletInfo(addr1.address);
      expect(walletInfo[0]).to.equal("Endowment Recipient 1"); // name
      expect(walletInfo[1]).to.equal("First endowment recipient wallet"); // description
      expect(walletInfo[2]).to.equal(true); // isActive

      // Update wallet
      await expect(
        endowmentWallet.updateWallet(
          addr1.address,
          "Updated Endowment Recipient 1",
          "Updated description"
        )
      )
        .to.emit(endowmentWallet, "WalletUpdated")
        .withArgs(addr1.address, "Updated Endowment Recipient 1");

      // Check updated info
      const updatedWalletInfo = await endowmentWallet.getWalletInfo(addr1.address);
      expect(updatedWalletInfo[0]).to.equal("Updated Endowment Recipient 1"); // name
      expect(updatedWalletInfo[1]).to.equal("Updated description"); // description
      expect(updatedWalletInfo[2]).to.equal(true); // isActive

      // Deactivate wallet
      await expect(
        endowmentWallet.deactivateWallet(addr1.address)
      )
        .to.emit(endowmentWallet, "WalletDeactivated")
        .withArgs(addr1.address);

      // Check that the wallet is deactivated
      const deactivatedWalletInfo = await endowmentWallet.getWalletInfo(addr1.address);
      expect(deactivatedWalletInfo[2]).to.equal(false); // isActive

      // Activate wallet
      await expect(
        endowmentWallet.activateWallet(addr1.address)
      )
        .to.emit(endowmentWallet, "WalletActivated")
        .withArgs(addr1.address);

      // Check that the wallet is activated
      const activatedWalletInfo = await endowmentWallet.getWalletInfo(addr1.address);
      expect(activatedWalletInfo[2]).to.equal(true); // isActive

      // Remove wallet
      await expect(
        endowmentWallet.removeWallet(addr1.address)
      )
        .to.emit(endowmentWallet, "WalletRemoved")
        .withArgs(addr1.address);

      // Check that the wallet was removed
      const finalWalletAddresses = await endowmentWallet.getWalletAddresses();
      expect(finalWalletAddresses.length).to.equal(0);
    });
  });
});