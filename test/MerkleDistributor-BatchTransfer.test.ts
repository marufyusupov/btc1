import { expect } from "chai";
import { ethers } from "hardhat";

describe("MerkleDistributor - Batch Transfer", function () {
  let merkleDistributor: any;
  let token: any;
  let owner: any;
  let recipient1: any;
  let recipient2: any;
  let recipient3: any;

  beforeEach(async function () {
    [owner, recipient1, recipient2, recipient3] = await ethers.getSigners();

    // Deploy a mock ERC20 token for testing
    const MockToken = await ethers.getContractFactory("MockERC20");
    token = await MockToken.deploy("Test Token", "TEST", 18);
    await token.waitForDeployment();

    // Deploy Merkle Distributor
    const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
    merkleDistributor = await MerkleDistributor.deploy(
      await token.getAddress(),
      owner.address,
      owner.address // Using owner as weekly distribution for testing
    );
    await merkleDistributor.waitForDeployment();

    // Add some wallets to the distributor
    await merkleDistributor.addWallet(recipient1.address, "Recipient 1", "First test recipient");
    await merkleDistributor.addWallet(recipient2.address, "Recipient 2", "Second test recipient");
    await merkleDistributor.addWallet(recipient3.address, "Recipient 3", "Third test recipient");

    // Mint some tokens to the distributor for testing
    await token.mint(await merkleDistributor.getAddress(), ethers.parseUnits("1000", 18));
  });

  it("should perform batch transfer correctly", async function () {
    // Check initial balances
    const initialDistributorBalance = await token.balanceOf(await merkleDistributor.getAddress());
    const initialRecipient1Balance = await token.balanceOf(recipient1.address);
    const initialRecipient2Balance = await token.balanceOf(recipient2.address);
    const initialRecipient3Balance = await token.balanceOf(recipient3.address);

    expect(initialDistributorBalance).to.equal(ethers.parseUnits("1000", 18));
    expect(initialRecipient1Balance).to.equal(0);
    expect(initialRecipient2Balance).to.equal(0);
    expect(initialRecipient3Balance).to.equal(0);

    // Perform batch transfer
    const recipients = [recipient1.address, recipient2.address, recipient3.address];
    const amounts = [
      ethers.parseUnits("100", 18),
      ethers.parseUnits("200", 18),
      ethers.parseUnits("150", 18)
    ];

    await expect(merkleDistributor.batchTransfer(
      await token.getAddress(),
      recipients,
      amounts
    )).to.emit(merkleDistributor, "BatchTransferCompleted");

    // Check final balances
    const finalDistributorBalance = await token.balanceOf(await merkleDistributor.getAddress());
    const finalRecipient1Balance = await token.balanceOf(recipient1.address);
    const finalRecipient2Balance = await token.balanceOf(recipient2.address);
    const finalRecipient3Balance = await token.balanceOf(recipient3.address);

    expect(finalDistributorBalance).to.equal(ethers.parseUnits("550", 18)); // 1000 - 100 - 200 - 150
    expect(finalRecipient1Balance).to.equal(ethers.parseUnits("100", 18));
    expect(finalRecipient2Balance).to.equal(ethers.parseUnits("200", 18));
    expect(finalRecipient3Balance).to.equal(ethers.parseUnits("150", 18));

    // Check distribution stats
    const stats = await merkleDistributor.getDistributionStats(await token.getAddress());
    expect(stats.totalDistributions).to.equal(1);
    expect(stats.totalAmountDistributed).to.equal(ethers.parseUnits("450", 18)); // 100 + 200 + 150
    expect(stats.totalRecipients).to.equal(3);
    expect(stats.totalFailed).to.equal(0);
  });

  it("should fail batch transfer with mismatched arrays", async function () {
    const recipients = [recipient1.address, recipient2.address];
    const amounts = [ethers.parseUnits("100", 18)];

    await expect(merkleDistributor.batchTransfer(
      await token.getAddress(),
      recipients,
      amounts
    )).to.be.revertedWith("length mismatch");
  });

  it("should fail batch transfer with no recipients", async function () {
    const recipients: string[] = [];
    const amounts: bigint[] = [];

    await expect(merkleDistributor.batchTransfer(
      await token.getAddress(),
      recipients,
      amounts
    )).to.be.revertedWith("no recipients");
  });

  it("should handle failed transfers gracefully", async function () {
    // Deploy a broken token that always fails transfers
    const BrokenToken = await ethers.getContractFactory("MockERC20");
    const brokenToken = await BrokenToken.deploy("Broken Token", "BROKEN", 18);
    await brokenToken.waitForDeployment();

    // Try to transfer the broken token
    const recipients = [recipient1.address, recipient2.address];
    const amounts = [
      ethers.parseUnits("100", 18),
      ethers.parseUnits("200", 18)
    ];

    await expect(merkleDistributor.batchTransfer(
      await brokenToken.getAddress(),
      recipients,
      amounts
    )).to.emit(merkleDistributor, "BatchTransferCompleted");

    // Check that transfers failed but transaction succeeded
    const stats = await merkleDistributor.getDistributionStats(await brokenToken.getAddress());
    expect(stats.totalDistributions).to.equal(1);
    expect(stats.totalAmountDistributed).to.equal(0);
    expect(stats.totalRecipients).to.equal(2);
    expect(stats.totalFailed).to.equal(2);
  });
});