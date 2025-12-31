// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NftCollection
 * @dev ERC-721 compatible NFT smart contract with max supply, admin controls, and metadata support.
 */
contract NftCollection is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    // State variables
    uint256 public maxSupply;
    uint256 public totalSupply;
    string public baseURI;
    bool public mintPaused;
    uint256 public minTokenId;
    uint256 public maxTokenId;

    // Events
    event MintPaused(bool paused, uint256 timestamp);
    event BaseURIUpdated(string newBaseURI, uint256 timestamp);
    event TokenBurned(uint256 indexed tokenId, address indexed owner, uint256 timestamp);

    // Modifiers
    modifier onlyWhenMintingActive() {
        require(!mintPaused, "Minting is currently paused");
        _;
    }

    /**
     * @dev Constructor to initialize the NFT collection.
     * @param _name The name of the NFT collection
     * @param _symbol The symbol of the NFT collection
     * @param _maxSupply The maximum number of NFTs that can be minted
     * @param _baseURI The base URI for token metadata
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        string memory _baseURI
    ) ERC721(_name, _symbol) {
        require(_maxSupply > 0, "Max supply must be greater than 0");
        maxSupply = _maxSupply;
        baseURI = _baseURI;
        minTokenId = 1;
        maxTokenId = _maxSupply;
        mintPaused = false;
        totalSupply = 0;
    }

    /**
     * @dev Safely mint a new NFT token.
     * @param to The address to mint the token to
     * @param tokenId The unique identifier for the token
     */
    function safeMint(
        address to,
        uint256 tokenId
    ) public onlyOwner onlyWhenMintingActive nonReentrant {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply < maxSupply, "Maximum supply reached");
        require(
            tokenId >= minTokenId && tokenId <= maxTokenId,
            "Token ID out of valid range"
        );
        require(!_exists(tokenId), "Token already exists");
        _safeMint(to, tokenId);
        totalSupply++;
    }

    /**
     * @dev Safely mint a token with metadata URI.
     * @param to The address to mint the token to
     * @param tokenId The unique identifier for the token
     * @param uri The metadata URI for the token
     */
    function safeMintWithURI(
        address to,
        uint256 tokenId,
        string memory uri
    ) public onlyOwner onlyWhenMintingActive nonReentrant {
        safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /**
     * @dev Burn a token and update the total supply.
     * @param tokenId The token ID to burn
     */
    function burn(uint256 tokenId) public nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "Not authorized to burn this token"
        );
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        totalSupply--;
        emit TokenBurned(tokenId, owner, block.timestamp);
    }

    /**
     * @dev Pause or unpause minting.
     * @param _paused True to pause minting, false to resume
     */
    function pauseMinting(bool _paused) public onlyOwner {
        mintPaused = _paused;
        emit MintPaused(_paused, block.timestamp);
    }

    /**
     * @dev Update the base URI for token metadata.
     * @param newBaseURI The new base URI
     */
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI, block.timestamp);
    }

    /**
     * @dev Get the token URI for a given token ID.
     * @param tokenId The token ID
     * @return The metadata URI for the token
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        string memory _tokenURI = super.tokenURI(tokenId);
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        // Build URI from base URI if not explicitly set
        if (bytes(baseURI).length > 0) {
            return
                string(
                    abi.encodePacked(
                        baseURI,
                        _uint2str(tokenId),
                        ".json"
                    )
                );
        }
        return "";
    }

    /**
     * @dev Override the _burn function to handle URIStorage.
     * @param tokenId The token ID to burn
     */
    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @dev Override supportsInterface for multiple inheritance.
     * @param interfaceId The interface ID to check
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Convert a uint256 to string (for URI generation).
     * @param value The value to convert
     */
    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Get the current balance of an address.
     * @param owner The address to check
     */
    function balanceOf(
        address owner
    ) public view override(ERC721) returns (uint256) {
        return super.balanceOf(owner);
    }

    /**
     * @dev Get the owner of a token.
     * @param tokenId The token ID
     */
    function ownerOf(
        uint256 tokenId
    ) public view override(ERC721) returns (address) {
        return super.ownerOf(tokenId);
    }
}
