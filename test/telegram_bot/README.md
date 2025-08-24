# Viral Meme NFT Telegram Bot

A comprehensive Telegram bot that transforms trending memes into valuable NFTs on the SEI blockchain.

## Features

### 🤖 Bot Commands
- `/start` - Welcome message and instructions
- `/connect` - Connect wallet (currently uses bot wallet)
- `/trending` - Find trending memes and generate NFT-ready images
- `/mint NUMBER` - Mint specific meme as NFT (e.g., `/mint 1`, `/mint 2`, `/mint all`)
- `/buy TOKEN_ID` - Purchase NFT from marketplace
- `/list` - View all NFTs currently for sale
- `/balance` - Check wallet balance
- `/help` - Show help message

### 🔄 Complete Workflow
1. **Discovery**: `/trending` runs the complete pipeline (polling.py + gemini_fixed.py)
2. **Analysis**: AI analyzes memes and generates 3 best NFT candidates
3. **Minting**: Users can mint individual or all memes with `/mint`
4. **Trading**: Built-in marketplace integration with `/buy` and `/list`

### 🛠 Technical Integration
- **Reddit Integration**: Uses polling.py to fetch viral memes from 10+ subreddits
- **AI Analysis**: Gemini AI analyzes memes for NFT suitability
- **IPFS Storage**: Automatic upload to Pinata for decentralized storage
- **SEI Blockchain**: Direct integration with MemeMinter and MemeSale contracts
- **Real-time Updates**: Live transaction tracking and status updates

## Setup Instructions

### 1. Install Dependencies
```bash
cd telegram_bot
npm install
```

### 2. Get Telegram Bot Token
1. Message @BotFather on Telegram
2. Create new bot with `/newbot`
3. Copy the bot token
4. Add to `.env` file

### 3. Configure Environment
Edit `.env` file:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

All other credentials are pre-configured for SEI testnet.

### 4. Run the Bot
```bash
npm start
```

## Usage Examples

### Basic Flow
```
User: /start
Bot: Welcome message with instructions

User: /connect  
Bot: Wallet connection info and setup

User: /trending
Bot: 🔍 Searching for trending memes...
     📥 Downloading from Reddit...
     🤖 AI analysis in progress...
     ✅ Found 3 trending memes!
     [Sends 3 NFT-ready images]

User: /mint 1
Bot: 🎨 Minting NFT 1...
     📤 Uploading to IPFS...
     ⛓️ Minting on blockchain...
     ✅ Success! Token ID: 123

User: /list
Bot: 🏪 NFT Marketplace
     Found 5 NFTs for sale...

User: /buy 123
Bot: 🛒 Purchasing NFT...
     ✅ Purchase successful!
```

### Advanced Features
- **Batch Minting**: `/mint all` mints all 3 trending memes at once
- **Smart Filtering**: AI only selects high-confidence, recognizable memes
- **Transaction Tracking**: Real-time blockchain confirmation
- **Error Handling**: Graceful error messages and retry logic

## Architecture

### Data Flow
```
Telegram Bot → polling.py → Reddit API → Downloaded Memes
             ↓
Gemini AI ← gemini_fixed.py ← Downloaded Memes
             ↓
NFT Images → IPFS Upload → Metadata Creation
             ↓
SEI Blockchain ← Smart Contracts ← Minting Transaction
             ↓
Marketplace Listing ← MemeSale Contract ← Auto-listing
```

### File Structure
```
telegram_bot/
├── bot.js              # Main bot logic
├── package.json        # Dependencies
├── .env               # Configuration
└── README.md          # This file

../                    # Parent directory
├── polling.py         # Reddit meme scraper
├── gemini_fixed.py    # AI analysis & NFT generation
├── complete_automation.js # Blockchain integration
└── results/
    └── nft_images/    # Generated NFT images
```

## Smart Contract Integration

### MemeMinter Contract
- **Address**: `0xF561B8856DB1d99874dBfFf31321C1D8d7d2E469`
- **Function**: Mints NFTs with metadata and trend hash
- **Gas Limit**: 500,000 per mint

### MemeSale Contract  
- **Address**: `0xFf0Fad274f08551890F8Ab7f1D5B719520FFcd51`
- **Functions**: List, buy, and manage NFT marketplace
- **Auto-listing**: Future feature for automated marketplace listing

## Security Features

- **Wallet Management**: Bot uses secure wallet for all transactions
- **Error Handling**: Comprehensive error catching and user feedback
- **Rate Limiting**: Prevents API abuse and blockchain spam
- **Input Validation**: Sanitizes all user inputs

## Future Enhancements

- [ ] User wallet integration (connect personal wallets)
- [ ] Custom meme upload and analysis
- [ ] Price setting for marketplace listings
- [ ] Portfolio tracking and analytics
- [ ] Multi-chain support
- [ ] Royalty distribution system

## Troubleshooting

### Common Issues
1. **"No trending memes found"**: Reddit API rate limits, try again later
2. **"Minting failed"**: Check wallet balance and network connectivity
3. **"Bot not responding"**: Verify bot token and restart service

### Debug Mode
Set environment variable for detailed logging:
```bash
DEBUG=true npm start
```

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Python dependencies are installed in parent directory
4. Check SEI testnet status and wallet balance

---

🚀 **Ready to turn viral memes into valuable NFTs!** 🎭
