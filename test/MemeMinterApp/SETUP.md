# PixelMeme NFT Setup Guide

## Environment Configuration

### 1. Copy Environment Variables
```bash
cp .env.example .env
```

### 2. Configure Pinata IPFS Service

#### Option 1: Using JWT Token (Recommended)
1. Go to [Pinata.cloud](https://pinata.cloud) and create an account
2. Generate a JWT token:
   - Navigate to API Keys section
   - Click "New Key" 
   - Select "Admin" permissions
   - Copy the JWT token

3. Update your `.env` file:
```bash
VITE_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Option 2: Using API Keys (Alternative)
If you prefer using API keys instead of JWT:
```bash
VITE_PINATA_API_KEY=your_actual_api_key_here
VITE_PINATA_SECRET_KEY=your_actual_secret_key_here
```

The service will automatically use JWT if available, otherwise fall back to API keys.

### 3. Deploy Smart Contracts

You need to deploy the following contracts to SEI testnet:

1. **MemeMinter721.sol** - The main NFT contract
2. **MemeSale.sol** - The marketplace contract

After deployment, update your `.env` file:
```bash
VITE_MEME_MINTER_CONTRACT=0xYourActualMemeMinterAddress
VITE_MEME_SALE_CONTRACT=0xYourActualMemeSaleAddress
```

### 4. SEI Testnet Configuration

The app is configured for SEI testnet with these settings:
- Chain ID: 1328 (0x530)
- RPC URL: https://evm-rpc-testnet.sei-apis.com
- Explorer: https://seitrace.com

### 5. Wallet Setup

Users need to:
1. Install a compatible wallet (MetaMask, Compass, etc.)
2. Add SEI testnet network
3. Get testnet tokens from faucet

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Copy and configure environment:
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. Start development server:
```bash
npm run dev
```

## Features Implemented

✅ **Multi-Wallet Connection**
- MetaMask, Compass, Coinbase, Trust Wallet, WalletConnect
- Automatic SEI testnet configuration
- Chain switching for wrong networks

✅ **Role-Based System**
- Creators: Can mint and list NFTs
- Buyers: Can browse and purchase NFTs
- Role selection before wallet connection

✅ **Dynamic Navigation**
- Different nav items based on user role
- Protected routes for creator features

✅ **Complete Minting System**
- Image upload with preview
- IPFS storage via Pinata
- Smart contract minting
- Automatic marketplace listing
- Progress tracking with visual feedback

✅ **Error Handling**
- Comprehensive error messages
- Transaction failure recovery
- User-friendly notifications

## Contract Integration

The app integrates with your smart contracts:

- **MemeMinter721**: ERC721 NFT contract for minting
- **MemeSale**: Marketplace contract for listing/buying

Functions used:
- `mintWithTrend(to, tokenURI, trendHash)` - Mint new NFT
- `setApprovalForAll(saleContract, true)` - Approve marketplace
- `listToken(tokenId, price)` - List NFT for sale

## IPFS Integration

Files are uploaded to IPFS via Pinata:
1. Image upload → IPFS hash
2. Metadata creation with image URL
3. Metadata upload → IPFS hash
4. NFT minted with metadata URI

## Troubleshooting

### Common Issues:

1. **Wallet won't connect**
   - Check if wallet is installed
   - Ensure wallet is unlocked
   - Try refreshing the page

2. **Wrong network**
   - App automatically prompts to switch to SEI testnet
   - Manually add network if auto-switch fails

3. **Minting fails**
   - Check contract addresses in `.env`
   - Ensure wallet has sufficient SEI for gas
   - Verify Pinata configuration

4. **IPFS upload fails**
   - Check Pinata API credentials
   - Verify file size (max 10MB)
   - Check internet connection

### Environment Variables Checklist:

```bash
# Required for IPFS uploads (choose one method)
VITE_PINATA_JWT=✅  # Recommended: JWT token
# OR
VITE_PINATA_API_KEY=✅  # Alternative: API key
VITE_PINATA_SECRET_KEY=✅  # Alternative: Secret key

# Required for smart contract interaction
VITE_MEME_MINTER_CONTRACT=✅
VITE_MEME_SALE_CONTRACT=✅

# Additional APIs (for future features)
VITE_INFURA_ID=✅
VITE_GEMINI_API_KEY=✅
VITE_STABILITY_API_KEY=✅

# Network configuration (optional, has defaults)
VITE_CHAIN_ID=1328
VITE_RPC_URL=https://evm-rpc-testnet.sei-apis.com
```

## Next Steps

1. Deploy contracts and update addresses
2. Configure Pinata API keys
3. Test full minting flow
4. Deploy to production

For additional support, check the contract deployment logs and ensure all addresses are correctly configured.
