# SEI Testnet Configuration Summary

## ✅ Network Configuration

### Chain Details
- **Network Name**: Sei Testnet
- **Chain ID**: 1328 (0x530 in hex)
- **RPC URL**: https://evm-rpc-testnet.sei-apis.com
- **Block Explorer**: https://seitrace.com
- **Native Currency**: SEI (18 decimals)

### Alternative Chain IDs (Fallback Support)
- **Primary**: 1328 (0x530) - Most commonly used
- **Alternative 1**: 713715 (0xAE5FB) - Some configurations
- **Alternative 2**: 504 (0x1F8) - Legacy configurations

### Deployed Smart Contracts
- **MemeMinter721**: `0xF561B8856DB1d99874dBfFf31321C1D8d7d2E469`
- **MemeSale**: `0xFf0Fad274f08551890F8Ab7f1D5B719520FFcd51`

## ✅ API Configuration

### Pinata IPFS
- **API Key**: `4d0007f6a472a4820cb0`
- **Secret Key**: `4956b045ca7470f4c39dbd7dcdd2908d1a874cfb0096d7d32c4a8aafe246ec35`

### AI Services
- **Gemini API**: `AIzaSyAQevDYh8-cFF4w2l71Z7LUWKj8f-EN6jE`
- **Stability AI**: `sk-TrOkanoOg4ETU8euCTMqf3CEAN79rGNcrKngVOyXCVKJzabT`

## ✅ Wallet Support

The application supports the following wallets on SEI testnet:

1. **MetaMask** - Auto-adds SEI testnet if not present
2. **Compass Wallet** - Native SEI support
3. **Coinbase Wallet** - With network switching
4. **Trust Wallet** - With network configuration
5. **WalletConnect** - Universal wallet connection

### Auto Network Switching
- All wallets will be prompted to switch to SEI testnet (713715)
- Network configuration is automatically added if missing
- Fallback support for different SEI testnet configurations

## ✅ Application Features

### Role-Based Access
- **Creators**: Can mint and list NFTs
- **Buyers**: Can browse and purchase NFTs

### NFT Minting Process
1. **Image Upload** → Pinata IPFS
2. **Metadata Creation** → IPFS storage  
3. **Smart Contract Minting** → SEI blockchain
4. **Marketplace Listing** → Automatic listing option

### Default Settings
- **Default NFT Price**: 0.01 SEI
- **Max Images**: 3 per collection
- **File Size Limit**: 10MB
- **Supported Formats**: JPG, PNG, GIF

## ✅ Environment Variables

```bash
# SEI Network
VITE_CHAIN_ID=1328
VITE_RPC_URL=https://evm-rpc-testnet.sei-apis.com
VITE_EXPLORER_URL=https://seitrace.com

# Smart Contracts  
VITE_MEME_MINTER_CONTRACT=0xF561B8856DB1d99874dBfFf31321C1D8d7d2E469
VITE_MEME_SALE_CONTRACT=0xFf0Fad274f08551890F8Ab7f1D5B719520FFcd51

# IPFS Storage
VITE_PINATA_API_KEY=4d0007f6a472a4820cb0
VITE_PINATA_SECRET_KEY=4956b045ca7470f4c39dbd7dcdd2908d1a874cfb0096d7d32c4a8aafe246ec35

# AI Services
VITE_GEMINI_API_KEY=AIzaSyAQevDYh8-cFF4w2l71Z7LUWKj8f-EN6jE
VITE_STABILITY_API_KEY=sk-TrOkanoOg4ETU8euCTMqf3CEAN79rGNcrKngVOyXCVKJzabT

# App Settings
VITE_DEFAULT_NFT_PRICE=0.01
VITE_MAX_NFT_IMAGES=3
```

## ✅ Testing on SEI Testnet

### Prerequisites
1. **SEI Testnet Tokens**: Get from SEI testnet faucet
2. **Compatible Wallet**: Install MetaMask, Compass, or supported wallet
3. **Network Setup**: App will auto-configure SEI testnet

### Test Flow
1. **Connect Wallet** → Choose Creator or Buyer role
2. **Switch Network** → App prompts for SEI testnet
3. **Create NFT** → Upload image, add details, mint
4. **IPFS Upload** → Automatic via Pinata
5. **Blockchain Mint** → Transaction on SEI testnet
6. **Marketplace List** → Optional auto-listing

### Verification
- Check transactions on: https://seitrace.com
- Verify IPFS uploads on: https://gateway.pinata.cloud/ipfs/[hash]
- Test wallet connections across different providers

## 🚀 Ready for Production

The application is fully configured for SEI testnet with:
- ✅ Real deployed smart contracts
- ✅ Working API keys for all services  
- ✅ Multi-wallet support with auto-switching
- ✅ Complete IPFS integration
- ✅ Role-based access control
- ✅ Error handling and user feedback

All systems are ready for testing and production deployment on SEI testnet!
