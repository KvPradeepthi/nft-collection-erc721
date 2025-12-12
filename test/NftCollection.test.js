const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NftCollection", function () {
  let nftCollection;
  let owner;
  let addr1;
  let addr2;
  const maxSupply = 100;
  const collectionName = "TestNFT";
  const collectionSymbol = "TNFT";
  const baseURI = "https://example.com/metadata/";

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const NftCollection = await ethers.getContractFactory("NftCollection");
    nftCollection = await NftCollection.deploy(
      collectionName,
      collectionSymbol,
      maxSupply,
      baseURI
    );
    await nftCollection.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct name, symbol, and max supply", async function () {
      expect(await nftCollection.name()).to.equal(collectionName);
      expect(await nftCollection.symbol()).to.equal(collectionSymbol);
      expect(await nftCollection.maxSupply()).to.equal(maxSupply);
    });

    it("Should initialize total supply to 0", async function () {
      expect(await nftCollection.totalSupply()).to.equal(0);
    });

    it("Should set owner correctly", async function () {
      expect(await nftCollection.owner()).to.equal(owner.address);
    });

    it("Should initialize minting as not paused", async function () {
      expect(await nftCollection.mintPaused()).to.equal(false);
    });

    it("Should set correct token ID ranges", async function () {
      expect(await nftCollection.minTokenId()).to.equal(1);
      expect(await nftCollection.maxTokenId()).to.equal(maxSupply);
    });
  });

  describe("Minting", function () {
    it("Should successfully mint a token to an address", async function () {
      await expect(nftCollection.safeMint(addr1.address, 1))
        .to.emit(nftCollection, "Transfer")
        .withArgs(ethers.constants.AddressZero, addr1.address, 1);

      expect(await nftCollection.ownerOf(1)).to.equal(addr1.address);
      expect(await nftCollection.balanceOf(addr1.address)).to.equal(1);
      expect(await nftCollection.totalSupply()).to.equal(1);
    });

    it("Should increment balances correctly", async function () {
      await nftCollection.safeMint(addr1.address, 1);
      await nftCollection.safeMint(addr1.address, 2);
      await nftCollection.safeMint(addr2.address, 3);

      expect(await nftCollection.balanceOf(addr1.address)).to.equal(2);
      expect(await nftCollection.balanceOf(addr2.address)).to.equal(1);
      expect(await nftCollection.totalSupply()).to.equal(3);
    });

    it("Should revert when minting to zero address", async function () {
      await expect(
        nftCollection.safeMint(ethers.constants.AddressZero, 1)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should revert when non-owner tries to mint", async function () {
      await expect(
        nftCollection.connect(addr1).safeMint(addr1.address, 1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert when minting exceeds max supply", async function () {
      for (let i = 1; i <= maxSupply; i++) {
        await nftCollection.safeMint(addr1.address, i);
      }

      await expect(
        nftCollection.safeMint(addr1.address, maxSupply + 1)
      ).to.be.revertedWith("Maximum supply reached");
    });

    it("Should revert when minting with invalid token ID", async function () {
      await expect(
        nftCollection.safeMint(addr1.address, maxSupply + 1)
      ).to.be.revertedWith("Token ID out of valid range");

      await expect(
        nftCollection.safeMint(addr1.address, 0)
      ).to.be.revertedWith("Token ID out of valid range");
    });

    it("Should revert when double-minting the same token", async function () {
      await nftCollection.safeMint(addr1.address, 1);

      await expect(
        nftCollection.safeMint(addr2.address, 1)
      ).to.be.revertedWith("Token already exists");
    });

    it("Should revert when minting while paused", async function () {
      await nftCollection.pauseMinting(true);

      await expect(
        nftCollection.safeMint(addr1.address, 1)
      ).to.be.revertedWith("Minting is currently paused");
    });
  });

  describe("Metadata", function () {
    beforeEach(async function () {
      await nftCollection.safeMint(addr1.address, 1);
    });

    it("Should return correct tokenURI with base URI", async function () {
      const uri = await nftCollection.tokenURI(1);
      expect(uri).to.equal(baseURI + "1.json");
    });

    it("Should revert for non-existent token URI", async function () {
      await expect(
        nftCollection.tokenURI(999)
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should support safeMintWithURI", async function () {
      const customURI = "https://custom.com/metadata/2.json";
      await nftCollection.safeMintWithURI(addr2.address, 2, customURI);

      const uri = await nftCollection.tokenURI(2);
      expect(uri).to.equal(customURI);
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await nftCollection.safeMint(addr1.address, 1);
    });

    it("Should allow owner to transfer token", async function () {
      await expect(
        nftCollection.connect(addr1).transferFrom(addr1.address, addr2.address, 1)
      )
        .to.emit(nftCollection, "Transfer")
        .withArgs(addr1.address, addr2.address, 1);

      expect(await nftCollection.ownerOf(1)).to.equal(addr2.address);
      expect(await nftCollection.balanceOf(addr1.address)).to.equal(0);
      expect(await nftCollection.balanceOf(addr2.address)).to.equal(1);
    });

    it("Should revert when transferring non-existent token", async function () {
      await expect(
        nftCollection.connect(addr1).transferFrom(addr1.address, addr2.address, 999)
      ).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Should revert when unauthorized address tries to transfer", async function () {
      await expect(
        nftCollection.connect(addr2).transferFrom(addr1.address, addr2.address, 1)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
  });

  describe("Approvals", function () {
    beforeEach(async function () {
      await nftCollection.safeMint(addr1.address, 1);
    });

    it("Should allow owner to approve another address", async function () {
      await expect(
        nftCollection.connect(addr1).approve(addr2.address, 1)
      )
        .to.emit(nftCollection, "Approval")
        .withArgs(addr1.address, addr2.address, 1);

      expect(await nftCollection.getApproved(1)).to.equal(addr2.address);
    });

    it("Should allow approved address to transfer", async function () {
      await nftCollection.connect(addr1).approve(addr2.address, 1);

      await expect(
        nftCollection.connect(addr2).transferFrom(addr1.address, addr2.address, 1)
      )
        .to.emit(nftCollection, "Transfer")
        .withArgs(addr1.address, addr2.address, 1);

      expect(await nftCollection.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should allow setApprovalForAll", async function () {
      await expect(
        nftCollection.connect(addr1).setApprovalForAll(addr2.address, true)
      )
        .to.emit(nftCollection, "ApprovalForAll")
        .withArgs(addr1.address, addr2.address, true);

      expect(await nftCollection.isApprovedForAll(addr1.address, addr2.address)).to.equal(true);
    });

    it("Operator should be able to transfer after setApprovalForAll", async function () {
      await nftCollection.connect(addr1).setApprovalForAll(addr2.address, true);

      await expect(
        nftCollection.connect(addr2).transferFrom(addr1.address, addr2.address, 1)
      )
        .to.emit(nftCollection, "Transfer")
        .withArgs(addr1.address, addr2.address, 1);

      expect(await nftCollection.ownerOf(1)).to.equal(addr2.address);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await nftCollection.safeMint(addr1.address, 1);
    });

    it("Should allow owner to burn token", async function () {
      await expect(
        nftCollection.connect(addr1).burn(1)
      )
        .to.emit(nftCollection, "Transfer")
        .withArgs(addr1.address, ethers.constants.AddressZero, 1);

      expect(await nftCollection.totalSupply()).to.equal(0);
      expect(await nftCollection.balanceOf(addr1.address)).to.equal(0);

      await expect(
        nftCollection.ownerOf(1)
      ).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Should revert when burning non-existent token", async function () {
      await expect(
        nftCollection.connect(addr1).burn(999)
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to pause/unpause minting", async function () {
      await expect(nftCollection.pauseMinting(true))
        .to.emit(nftCollection, "MintPaused")
        .withArgs(true);

      expect(await nftCollection.mintPaused()).to.equal(true);

      await expect(nftCollection.pauseMinting(false))
        .to.emit(nftCollection, "MintPaused")
        .withArgs(false);

      expect(await nftCollection.mintPaused()).to.equal(false);
    });

    it("Should revert when non-owner tries to pause minting", async function () {
      await expect(
        nftCollection.connect(addr1).pauseMinting(true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to update base URI", async function () {
      const newBaseURI = "https://newexample.com/metadata/";

      await expect(nftCollection.setBaseURI(newBaseURI))
        .to.emit(nftCollection, "BaseURIUpdated");

      await nftCollection.safeMint(addr1.address, 1);
      const uri = await nftCollection.tokenURI(1);
      expect(uri).to.equal(newBaseURI + "1.json");
    });
  });

  describe("Gas Optimization", function () {
    it("Should mint with reasonable gas", async function () {
      const tx = await nftCollection.safeMint(addr1.address, 1);
      const receipt = await tx.wait();

      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("Should transfer with reasonable gas", async function () {
      await nftCollection.safeMint(addr1.address, 1);

      const tx = await nftCollection
        .connect(addr1)
        .transferFrom(addr1.address, addr2.address, 1);
      const receipt = await tx.wait();

      expect(receipt.gasUsed).to.be.lt(100000);
    });
  });
});
