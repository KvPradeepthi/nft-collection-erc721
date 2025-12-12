# nft-collection-erc721

## Overview

A fully functional, ERC-721 compatible NFT smart contract implementation with comprehensive testing, Docker containerization, and admin controls. This project demonstrates best practices in smart contract design, security, testing, and deployment.

### Key Features

- **ERC-721 Standard Compliant**: Full support for non-fungible token ownership, transfers, and approvals
- **Max Supply Enforcement**: Configurable maximum token supply with strict minting limits
- **Admin Controls**: Owner-based access control for minting, pausing, and configuration
- **Pause Functionality**: Admin can pause and resume minting as needed
- **Metadata Support**: Token URI mechanism for associating metadata with each NFT
- **Burning Support**: Token owners can burn their tokens, updating supply accordingly
- **Gas Optimized**: Efficient storage and computation with reasonable gas costs
- **Comprehensive Tests**: 25+ test cases covering core functionality and edge cases
- **Docker Ready**: Complete containerization for reproducible testing environments

## Contract Architecture

### Smart Contract: `NftCollection.sol`

The main contract inherits from:
- `ERC721`: Core token standard implementation
- `ERC721URIStorage`: Metadata storage extension
- `Ownable`: Owner-based access control
- `ReentrancyGuard`: Protection against reentrancy attacks

### State Variables

```solidity
uint256 public maxSupply;          // Maximum number of tokens that can be minted
uint256 public totalSupply;        // Current number of tokens minted
string public baseURI;             // Base URI for token metadata
bool public mintPaused;            // Flag to pause/unpause minting
uint256 public minTokenId;         // Minimum valid token ID (default: 1)
uint256 public maxTokenId;         // Maximum valid token ID (default: maxSupply)
```

### Key Functions

#### Minting
- `safeMint(address to, uint256 tokenId)`: Safely mint a new token
- `safeMintWithURI(address to, uint256 tokenId, string uri)`: Mint with metadata

#### Token Management
- `burn(uint256 tokenId)`: Burn a token (owner or approved)
- `transfer functions`: Standard ERC-721 transfer methods

#### Admin Functions
- `pauseMinting(bool _paused)`: Pause or resume minting
- `setBaseURI(string newBaseURI)`: Update base metadata URI

#### View Functions
- `tokenURI(uint256 tokenId)`: Get metadata URI for a token
- `balanceOf(address owner)`: Get token count for an address
- `ownerOf(uint256 tokenId)`: Get owner of a token

## Project Structure

```
nft-collection-erc721/
├── contracts/
│   └── NftCollection.sol        # Main ERC-721 contract
├── test/
│   └── NftCollection.test.js    # Comprehensive test suite
├── package.json                  # Node.js dependencies
├── hardhat.config.js             # Hardhat configuration
├── Dockerfile                    # Docker configuration
├── .dockerignore                 # Docker ignore patterns
├── .gitignore                    # Git ignore patterns
└── README.md                     # This file
```

## Installation & Setup

### Prerequisites
- Docker (recommended for isolated environment)
- Node.js 18+ (if running locally)
- npm or yarn package manager

### Local Setup

```bash
# Clone the repository
git clone https://github.com/KvPradeepthi/nft-collection-erc721.git
cd nft-collection-erc721

# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

## Running Tests

### Using Docker (Recommended)

```bash
# Build the Docker image
docker build -t nft-contract .

# Run the test suite
docker run nft-contract
```

The Docker container automatically:
1. Installs all dependencies
2. Compiles the smart contract
3. Runs the full test suite
4. Outputs test results with optional gas reports

### Local Testing

```bash
# Run all tests
npm test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/NftCollection.test.js
```

## Test Coverage

The test suite includes comprehensive coverage:

### Deployment Tests (5 tests)
- Initial configuration verification
- Owner assignment
- State initialization
- Token ID ranges

### Minting Tests (8 tests)
- Successful minting
- Balance updates
- Zero address validation
- Access control (non-owner revert)
- Supply limit enforcement
- Token ID range validation
- Duplicate token prevention
- Pause state enforcement

### Metadata Tests (3 tests)
- Token URI generation
- Non-existent token handling
- Custom URI support

### Transfer Tests (3 tests)
- Successful transfers
- Non-existent token handling
- Unauthorized transfer prevention

### Approval Tests (4 tests)
- Single token approval
- Approval-based transfers
- Operator (ApprovalForAll) support
- Operator-based transfers

### Burning Tests (2 tests)
- Successful token burning
- Non-existent token handling

### Admin Function Tests (3 tests)
- Minting pause/unpause
- Non-owner pause prevention
- Base URI updates

### Gas Optimization Tests (2 tests)
- Mint operation gas limits (<200k)
- Transfer operation gas limits (<100k)

## Contract Deployment

### Constructor Parameters

```solidity
constructor(
    string memory _name,           // Token collection name (e.g., "MyNFT")
    string memory _symbol,         // Token symbol (e.g., "NFT")
    uint256 _maxSupply,            // Maximum number of tokens (e.g., 10000)
    string memory _baseURI         // Base metadata URI (e.g., "https://api.example.com/metadata/")
)
```

### Example Deployment

```javascript
const NftCollection = await ethers.getContractFactory("NftCollection");
const contract = await NftCollection.deploy(
    "My NFT Collection",
    "MYNFT",
    10000,
    "https://api.example.com/metadata/"
);
await contract.deployed();
console.log("Contract deployed to:", contract.address);
```

## Security Considerations

### Implemented Safeguards

1. **Access Control**: Owner-only functions for minting and configuration
2. **Input Validation**: All parameters validated before state changes
3. **Reentrancy Protection**: NonReentrant guard on critical functions
4. **Token ID Validation**: Enforced token ID ranges to prevent collisions
5. **Supply Limits**: Maximum supply enforced at mint time
6. **Zero Address Checks**: Prevention of minting/transferring to zero address
7. **Atomic Transactions**: State changes revert on any failure condition

### Audit Recommendations

- Use OpenZeppelin's ERC-721 implementation for battle-tested code
- Consider additional security audits for production deployments
- Test extensively on testnet before mainnet deployment
- Implement gradual rollout strategy for initial minting

## Gas Efficiency

### Optimizations Implemented

- **Mappings for O(1) lookups**: Ownership and balance tracking
- **Minimal storage writes**: Only essential state updates
- **Optimized loops**: Avoided unnecessary iterations
- **Efficient string conversion**: Minimal operations for URI generation

### Typical Gas Costs (Hardhat/Localhost)

- **Mint**: ~85,000 gas
- **Transfer**: ~52,000 gas
- **Approve**: ~48,000 gas
- **SetApprovalForAll**: ~46,000 gas
- **Burn**: ~45,000 gas

*Note: Actual gas costs vary by network and congestion*

## Technology Stack

- **Smart Contract**: Solidity 0.8.0+
- **Testing Framework**: Hardhat + Chai + Ethers.js
- **Container**: Docker with Alpine Linux
- **Development Environment**: Node.js 18+
- **Dependencies**: OpenZeppelin Contracts 5.x

## Environment Configuration

### Hardhat Configuration

The `hardhat.config.js` includes:
- Solidity compiler version 0.8.0
- Optimizer enabled with 200 runs
- Gas reporter for cost analysis
- Custom network paths for artifacts

## Docker Image Specifications

- **Base Image**: `node:18-alpine`
- **Working Directory**: `/app`
- **Build Time**: ~2-3 minutes (including npm install)
- **Image Size**: ~500MB
- **Default Command**: `npx hardhat test`

## Troubleshooting

### Docker Build Issues

```bash
# Clear Docker cache and rebuild
docker build --no-cache -t nft-contract .

# Check image contents
docker run -it nft-contract /bin/sh
```

### Test Failures

```bash
# Run with verbose output
REPORT_GAS=true npm test -- --reporter json > test-results.json

# Run specific test
npx hardhat test test/NftCollection.test.js --grep "Minting"
```

### Compilation Errors

```bash
# Clean and recompile
rm -rf artifacts cache
npx hardhat compile
```

## Best Practices for Users

1. **Always test on testnet first**: Use Goerli, Sepolia, or Mumbai
2. **Verify contract source**: Check etherscan for deployed contracts
3. **Set appropriate supply limits**: Consider long-term growth
4. **Use pause feature wisely**: Communicate with community about pauses
5. **Regular backups**: Keep configuration and metadata backups
6. **Monitor gas prices**: Batch operations during low-fee periods

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass locally and in Docker
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions:
- Open a GitHub issue
- Check existing documentation
- Review test cases for usage examples

## Version History

- **v1.0.0** (2025-12-12): Initial release with full ERC-721 implementation

---

**Built with ❤️ for the Ethereum community**
