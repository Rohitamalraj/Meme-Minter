# 🐸 MemeMinter

**MemeMinter** is a decentralized NFT platform where users can mint viral memes as NFTs directly from their **browser** or **Telegram**.  
The goal is to bridge the gap between meme culture and blockchain ownership, giving creators the power to **monetize memes**, while collectors get **provable on-chain ownership**.  

> Memes are one of the most powerful forms of internet culture. With NFTs, memes can now be more than just viral images — they become **digital assets** with value, scarcity, and community-driven significance.

---

## 🛠 Core Features

### 🎨 Meme Minting
- Upload your own meme or generate one using integrated AI/creative tools.
- Mint it as an NFT on the blockchain (**ERC-721 standard**).
- Store metadata such as title, description, and creator address.

### 🔑 Ownership & Provenance
- Blockchain-backed ownership for every meme NFT.
- Verify authenticity easily on **Etherscan**.

### 🖼 Meme Gallery
- Browse your own minted memes.
- Explore the public gallery of viral memes minted by others.

### 🤖 Telegram Bot Integration
- Mint memes directly from **Telegram**.
- Send memes to the bot → instantly mint them as NFTs.

### 💳 Web3 Wallet Support
- Connect **Compass Wallet** or other Web3 wallets.
- Easy **Sei (testnet)** minting for demos (extendable to mainnet).

### 🎮 Gamification *(future scope)*
- Leaderboards for “most minted memes.”
- Community voting on top viral memes.

---

## 🤖 MemeMinter Autonomous Bot

Beyond the web app, MemeMinter also includes an **AI-powered Telegram bot** that acts as an **autonomous meme-minter and promoter**:

- ⚡ **Machine-Speed Workflow** → From viral trend to purchasable NFT in under 60 seconds.  
- 🧠 **Agent Autonomy** → Hunts trends, generates memes, mints them, and lists them for sale.  
- 📱 **Social-First UX** → Native Telegram integration with instant checkout.  

### Bot Commands
- `/trend <topic>` → Generates meme from a trending topic.  
- **Autonomous mode** → Scans Twitter, Reddit, and Telegram for viral content every few minutes.  

### Bot Features
- Preview → Mint → List directly inside Telegram.  
- WebApp checkout for buyers with Compass/MetaMask wallet connection.  
- Real-time notifications when your memes sell.  

---

## 🛍 Buyer Flow (Telegram)

1. Discover meme in Telegram channel/chat.  
2. Tap **Buy Now** → WebApp opens.  
3. Connect wallet → Confirm purchase.  
4. Instantly receive NFT ownership with **explorer link**.  

---

## 🏗 Architecture

### Frontend (MemeMinterApp)
- React + Vite + TailwindCSS  
- Web3.js / ethers.js integration  
- Meme upload & mint UI  

### Smart Contracts (Sei EVM)
- `MemeMint721.sol` → ERC-721 NFT contract  
- `MemeSale.sol` → Marketplace with royalties + fixed-price sales  

### Storage
- **IPFS/Pinata** for meme images  
- Metadata JSON linked to NFT  

### Telegram Bot
- Autonomous trend detection + AI meme generation  
- IPFS + Pinata storage integration  
- NFT minting and listing via MemeMinter contracts  
- Instant checkout + buyer notifications  

### Deployment
- **Frontend** → Vercel  
- **Contracts** → Sei testnet (extendable to Ethereum / Base / Polygon)  
- **Bot** → Telegram Bot API hosted on Render / Heroku / VPS  

---

## 🔄 Workflow

### Web App Flow
1. Connect MetaMask  
2. Upload / Generate Meme  
3. Enter Metadata  
4. Mint NFT → Confirm TX  
5. NFT added to profile  

### Telegram Bot Flow
1. Send meme image or `/trend <topic>`  
2. Bot generates or mints meme  
3. Metadata + NFT created  
4. TX confirmed → NFT returned to user  

### Autonomous Bot Flow
1. AI agent hunts viral trends  
2. Generates meme  
3. Uploads to IPFS  
4. Mints NFT  
5. Lists on marketplace  
6. Promotes in Telegram channels  

---

## 🚀 Roadmap
- ✅ Web App with meme minting  
- ✅ Telegram bot integration  
- 🔜 Meme marketplace with royalties  
- 🔜 Gamification + Leaderboards  
- 🔜 Cross-chain minting (Ethereum, Base, Polygon)  

---

## 📜 License
MIT License © 2025 MemeMinter
