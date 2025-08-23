const TelegramBot = require('node-telegram-bot-api');
const { ethers } = require('ethers');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');
const { spawn } = require('child_process');
require('dotenv').config();

// ========== CONFIGURATION ==========
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MEME_MINTER_ADDRESS = process.env.MEME_MINTER_ADDRESS;
const MEME_SALE_ADDRESS = process.env.MEME_SALE_ADDRESS;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const SEI_RPC = process.env.SEI_RPC;
const CHAIN_ID = parseInt(process.env.CHAIN_ID);
const MAX_NFT_IMAGES = parseInt(process.env.MAX_NFT_IMAGES) || 3;
const DEFAULT_NFT_PRICE = process.env.DEFAULT_NFT_PRICE || "0.01";

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Blockchain setup
const provider = new ethers.JsonRpcProvider(SEI_RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract ABIs
const MEME_MINTER_ABI = [
  "function mintTo(address to, string memory tokenURI, string memory trendHash) public returns (uint256)",
  "function getCurrentTokenId() public view returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function setApprovalForAll(address operator, bool approved) public",
  "function isApprovedForAll(address owner, address operator) public view returns (bool)"
];

const MEME_SALE_ABI = [
  "function list(address nft, uint256 tokenId, uint256 price) public returns (uint256)",
  "function buy(uint256 listingId) public payable",
  "function getCurrentListingId() public view returns (uint256)",
  "function getListingById(uint256 listingId) public view returns (tuple(address nft, uint256 tokenId, address seller, uint256 price, bool active))",
  "function paused() public view returns (bool)",
  "event Listed(uint256 indexed listingId, address indexed nft, uint256 indexed tokenId, address seller, uint256 price)",
  "event Sold(uint256 indexed listingId, address indexed buyer, uint256 price)",
  "event Unlisted(uint256 indexed listingId)"
];

// Initialize contracts
const minterContract = new ethers.Contract(MEME_MINTER_ADDRESS, MEME_MINTER_ABI, wallet);
const saleContract = new ethers.Contract(MEME_SALE_ADDRESS, MEME_SALE_ABI, wallet);

// User session storage
const userSessions = new Map();

// ========== UTILITY FUNCTIONS ==========

function getUserSession(chatId) {
  if (!userSessions.has(chatId)) {
    userSessions.set(chatId, {
      walletConnected: false,
      walletAddress: null,
      currentMemes: [],
      pendingMints: [],
      awaitingWalletAddress: false
    });
  }
  return userSessions.get(chatId);
}

async function uploadImageToPinata(filePath) {
  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));
  
  const filename = path.basename(filePath);
  data.append("pinataMetadata", JSON.stringify({
    name: filename,
    keyvalues: {
      type: "nft-image",
      collection: "viral-memes-telegram"
    }
  }));

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    data,
    {
      headers: {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY,
        ...data.getHeaders(),
      },
    }
  );

  return {
    hash: res.data.IpfsHash,
    url: `ipfs://${res.data.IpfsHash}`
  };
}

async function uploadMetadataToPinata(imageData, nftDetails) {
  const metadata = {
    name: nftDetails.name,
    description: nftDetails.description,
    image: imageData.url,
    attributes: [
      {
        trait_type: "Meme Template",
        value: nftDetails.template
      },
      {
        trait_type: "Source",
        value: "Telegram Bot"
      },
      {
        trait_type: "Generation Date",
        value: new Date().toISOString().split('T')[0]
      }
    ],
    external_url: "https://viral-memes-telegram.com",
    background_color: "000000"
  };

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    metadata,
    {
      headers: {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY,
        "Content-Type": "application/json"
      },
    }
  );

  return {
    hash: res.data.IpfsHash,
    url: `ipfs://${res.data.IpfsHash}`,
    metadata
  };
}

function createNFTDetails(imagePath) {
  const imageName = path.basename(imagePath, path.extname(imagePath));
  
  return {
    name: `Viral Meme NFT #${imageName}`,
    description: `A unique NFT representing a viral meme from internet culture. Minted via Telegram bot on SEI blockchain. Part of the exclusive Viral Memes Collection.`,
    template: imageName.replace(/[^a-zA-Z0-9]/g, ' ').trim(),
  };
}

async function runPythonScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    // Use Python from virtual environment
    const pythonExe = 'D:\\SEI\\test\\.venv\\Scripts\\python.exe';
    const python = spawn(pythonExe, [scriptPath, ...args], {
      cwd: 'D:\\SEI\\test',  // Use absolute path to ensure correct directory
      env: {
        ...process.env,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY
      }
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      console.log(`Python script exited with code: ${code}`);
      console.log(`Python stdout: ${stdout}`);
      console.log(`Python stderr: ${stderr}`);
      
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });
  });
}

async function runNodeScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const node = spawn('node', [scriptPath, ...args], {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env
      }
    });

    let stdout = '';
    let stderr = '';

    node.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    node.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    node.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Node script failed: ${stderr}\n${stdout}`));
      }
    });
  });
}

// ========== BOT COMMANDS ==========

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const session = getUserSession(chatId);
  
  const welcomeMessage = `🎭 Welcome to Viral Meme NFT Bot!

Transform trending Reddit memes into premium NFTs using AI on SEI blockchain!

🤖 **ENHANCED WITH STABILITY AI** 🤖

Available Commands:
🔗 /connect - Connect your wallet
📈 /trending - Discover viral memes & generate premium NFT images
🎨 /mint - Complete automation (IPFS + Mint + List)
🛒 /buy TOKEN_ID - Buy an NFT from marketplace
📋 /list - View all NFTs for sale
💰 /balance - Check your wallet balance
❓ /help - Show this help message

🚀 **How it works:**
1. /trending → Analyzes 10 viral Reddit memes
2. Stability AI → Generates premium NFT images (top 3 only!)
3. /mint → Complete automation: IPFS + SEI blockchain + marketplace
4. Trade & profit from viral internet culture!

✨ **Premium Features:**
• Only famous meme characters qualify (95%+ AI confidence)
• Professional NFT quality via Stability AI
• Automatic IPFS upload via Pinata
• Smart contract minting on SEI testnet
• Instant marketplace listing for trading

Get started with /connect to link your wallet! 🚀`;
  
  bot.sendMessage(chatId, welcomeMessage);
});

// /connect command
bot.onText(/\/connect/, async (msg) => {
  const chatId = msg.chat.id;
  const session = getUserSession(chatId);
  
  if (session.walletConnected) {
    bot.sendMessage(chatId, `✅ Wallet already connected!
    
🏦 Your wallet: ${session.walletAddress}
🌐 Network: SEI Testnet
� Use /balance to check your balance

To disconnect and connect a different wallet, use /disconnect`);
    return;
  }
  
  const connectMessage = `🔗 Connect Your Wallet

To use this bot, you need to connect your SEI testnet wallet.

📋 Setup Instructions:
1. Install MetaMask browser extension
2. Add SEI Testnet network with these details:
   • Network Name: SEI Testnet
   • RPC URL: ${SEI_RPC}
   • Chain ID: ${CHAIN_ID}
   • Currency Symbol: SEI
   • Block Explorer: https://seitrace.com
   
3. Get testnet SEI from faucet: https://faucet.sei-apis.com/
4. Copy your wallet address from MetaMask
5. Send your wallet address here

💡 Example wallet address: 0x1234567890123456789012345678901234567890

Please send your SEI wallet address:`;
  
  session.awaitingWalletAddress = true;
  bot.sendMessage(chatId, connectMessage);
});

// /disconnect command
bot.onText(/\/disconnect/, async (msg) => {
  const chatId = msg.chat.id;
  const session = getUserSession(chatId);
  
  session.walletConnected = false;
  session.walletAddress = null;
  session.awaitingWalletAddress = false;
  session.currentMemes = [];
  session.pendingMints = [];
  
  bot.sendMessage(chatId, `🔌 Wallet disconnected successfully!

Use /connect to connect a new wallet.`);
});

// /trending command
bot.onText(/\/trending/, async (msg) => {
  const chatId = msg.chat.id;
  const session = getUserSession(chatId);
  
  if (!session.walletConnected) {
    bot.sendMessage(chatId, "❌ Please connect your wallet first with /connect");
    return;
  }
  
  const loadingMsg = await bot.sendMessage(chatId, "🔍 Starting viral meme discovery & NFT generation pipeline...");
  
  try {
    // Update progress message
    bot.editMessageText(
      "📥 Running Enhanced Viral Meme Pipeline...\n\n🔍 Step 1: Discovering trending memes from Reddit\n⏳ This may take 2-3 minutes...", 
      { chat_id: chatId, message_id: loadingMsg.message_id }
    );
    
    // Run the enhanced Python pipeline (polling.py + gemini_fixed.py with Stability AI)
    const pipelineOutput = await runPythonScript('D:\\SEI\\test\\run_pipeline.py');
    console.log('Enhanced pipeline output:', pipelineOutput);
    
    // Update progress message
    bot.editMessageText(
      "🎨 Pipeline completed! Processing results...", 
      { chat_id: chatId, message_id: loadingMsg.message_id }
    );
    
    // Check if NFT images were generated by Stability AI
    const nftImagesDir = path.join(__dirname, '..', 'results', 'nft_images');
    
    if (!fs.existsSync(nftImagesDir)) {
      bot.editMessageText(
        "❌ NFT images directory not found. Pipeline may have failed.\n\nTry running /trending again or check if there are any popular memes available.",
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
      return;
    }
    
    // Get newly generated NFT files (filter by recent modification time)
    const allFiles = fs.readdirSync(nftImagesDir);
    const nftFiles = allFiles
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
      .map(file => ({
        name: file,
        path: path.join(nftImagesDir, file),
        mtime: fs.statSync(path.join(nftImagesDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime) // Sort by newest first
      .slice(0, MAX_NFT_IMAGES)
      .map(file => file.name);
    
    if (nftFiles.length === 0) {
      bot.editMessageText(
        "❌ No viral memes were suitable for NFT generation!\n\n🔄 This can happen if:\n• No memes met the quality threshold (95%+ confidence)\n• No famous meme characters were found\n• All memes were low NFT potential\n\nTry again later when new viral content appears!",
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
      return;
    }
    
    // Store current memes in session
    session.currentMemes = nftFiles;
    
    bot.editMessageText(
      `✅ Enhanced Pipeline Success!\n\n🎨 Generated ${session.currentMemes.length} high-quality NFT images using Stability AI!\n🏆 Only the best viral meme characters made the cut!`,
      { chat_id: chatId, message_id: loadingMsg.message_id }
    );
    
    // Send each NFT image with enhanced details
    for (let i = 0; i < session.currentMemes.length; i++) {
      const file = session.currentMemes[i];
      const filePath = path.join(nftImagesDir, file);
      const nftDetails = createNFTDetails(filePath);
      
      // Extract meme template name from filename for better display
      const templateName = file
        .replace('_NFT.png', '')
        .replace('_NFT.jpg', '')
        .replace('_NFT.jpeg', '')
        .replace(/[_-]/g, ' ');
      
      const caption = `🎨 Viral Meme NFT #${i + 1} (Stability AI Generated)

🏷️ Name: ${nftDetails.name}
🎭 Template: ${templateName}
🤖 AI Engine: Stability AI
⭐ Quality: Premium NFT Collection
💎 Rarity: High (Only famous memes qualify)

💰 Mint Price: ${DEFAULT_NFT_PRICE} SEI
🏪 Auto-list after minting: ✅

Ready to mint this premium NFT? Use /mint ${i + 1}`;
      
      await bot.sendPhoto(chatId, filePath, {
        caption: caption
      });
      
      // Small delay between images to avoid flooding
      if (i < session.currentMemes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Send enhanced summary message
    const summaryMessage = `🎯 Enhanced Viral Meme Pipeline Complete!

✨ **RESULTS:**
• Analyzed 10 trending Reddit memes
• Generated ${session.currentMemes.length}/${MAX_NFT_IMAGES} premium NFT images
• Used Stability AI for professional quality
• Only famous meme characters qualified (95%+ confidence)

🚀 **NEXT STEPS:**
• /mint 1 - Mint first NFT
• /mint 2 - Mint second NFT  
• /mint 3 - Mint third NFT
• /mint all - Mint all NFTs at once

💰 **AUTOMATION INCLUDED:**
• IPFS upload via Pinata
• Smart contract minting on SEI
• Automatic marketplace listing
• Ready for trading!

� Your viral memes are now ready to become valuable NFTs!`;
    
    bot.sendMessage(chatId, summaryMessage);
    
  } catch (error) {
    console.error('Error in enhanced trending command:', error);
    bot.editMessageText(
      `❌ Enhanced Pipeline Failed: ${error.message}\n\nThis could be due to:\n• Network connectivity issues\n• API rate limits\n• Insufficient viral content\n\nPlease try again in a few minutes.`,
      { chat_id: chatId, message_id: loadingMsg.message_id }
    );
  }
});

// /mint command
bot.onText(/\/mint (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const session = getUserSession(chatId);
  const input = match[1].trim();
  
  if (!session.walletConnected) {
    bot.sendMessage(chatId, "❌ Please connect your wallet first with /connect");
    return;
  }
  
  if (!session.currentMemes || session.currentMemes.length === 0) {
    bot.sendMessage(chatId, "❌ No memes available. Use /trending first to get viral memes with Stability AI generation!");
    return;
  }
  
  let memesToMint = [];
  
  if (input.toLowerCase() === 'all') {
    memesToMint = session.currentMemes.map((file, index) => ({ file, index: index + 1 }));
  } else {
    const memeNumber = parseInt(input);
    if (isNaN(memeNumber) || memeNumber < 1 || memeNumber > session.currentMemes.length) {
      bot.sendMessage(chatId, `❌ Invalid meme number. Please use 1-${session.currentMemes.length} or 'all'`);
      return;
    }
    memesToMint = [{ file: session.currentMemes[memeNumber - 1], index: memeNumber }];
  }
  
  const processingMsg = await bot.sendMessage(chatId, `🎨 Starting Complete NFT Automation...\n\n🔄 Processing ${memesToMint.length} NFT(s) through full pipeline...`);
  
  const results = [];
  
  for (const { file, index } of memesToMint) {
    try {
      // Extract template name for better display
      const templateName = file
        .replace('_NFT.png', '')
        .replace('_NFT.jpg', '')
        .replace('_NFT.jpeg', '')
        .replace(/[_-]/g, ' ');
      
      bot.editMessageText(
        `🎨 Minting NFT ${index}/${session.currentMemes.length}: ${templateName}\n\n🔄 **AUTOMATION STEPS:**\n📤 Uploading to IPFS...\n⛓️ Minting on SEI blockchain...\n🏪 Listing on marketplace...\n\n⏳ This may take 30-60 seconds...`,
        { chat_id: chatId, message_id: processingMsg.message_id }
      );
      
      // Run the complete automation (IPFS + Blockchain + Marketplace)
      const output = await runNodeScript('mint_single_nft.js', [file]);
      console.log('Complete automation output:', output);
      
      // Parse the result from the script output
      const resultMatch = output.match(/🤖 BOT_RESULT: (.+)/);
      if (resultMatch) {
        const result = JSON.parse(resultMatch[1]);
        results.push(result);
        
        if (result.success) {
          bot.editMessageText(
            `✅ NFT ${index} minted successfully!\n🆔 Token ID: ${result.tokenId}\n🏪 Listed for ${result.listingPrice} SEI`,
            { chat_id: chatId, message_id: processingMsg.message_id }
          );
          
          // Small delay between mints
          if (memesToMint.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error('Could not parse minting result');
      }
      
    } catch (error) {
      console.error(`Error minting NFT ${index}:`, error);
      results.push({
        index,
        file,
        success: false,
        error: error.message
      });
      
      bot.editMessageText(
        `❌ Failed to mint NFT ${index}: ${error.message}`,
        { chat_id: chatId, message_id: processingMsg.message_id }
      );
    }
  }
  
  // Send final results
  const successfulMints = results.filter(r => r.success);
  const failedMints = results.filter(r => !r.success);
  
  if (successfulMints.length > 0) {
    let successMessage = `🎉 Successfully Minted ${successfulMints.length} NFT(s)!\n\n`;
    
    successfulMints.forEach(result => {
      successMessage += `NFT: ${result.nftDetails.name}\n`;
      successMessage += `🎨 Token ID: ${result.tokenId}\n`;
      successMessage += `🔗 Mint TX: ${result.mintTransactionHash}\n`;
      successMessage += `� Listing ID: ${result.listingId}\n`;
      successMessage += `� Price: ${result.listingPrice} SEI\n`;
      successMessage += `🌐 IPFS: ${result.imageURL}\n\n`;
    });
    
    successMessage += `🎊 Your NFTs are now minted and listed for sale!\n`;
    successMessage += `📋 Use /list to see all marketplace NFTs`;
    
    bot.sendMessage(chatId, successMessage);
  }
  
  if (failedMints.length > 0) {
    let errorMessage = `❌ Failed to mint ${failedMints.length} NFT(s):\n\n`;
    failedMints.forEach(result => {
      errorMessage += `NFT #${result.index}: ${result.error}\n`;
    });
    
    bot.sendMessage(chatId, errorMessage);
  }
});

// /buy command - FULLY FUNCTIONAL
bot.onText(/\/buy (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const session = getUserSession(chatId);
  const input = match[1].trim();
  
  console.log('🔍 Buy command input:', input, 'type:', typeof input);
  
  if (!session.walletConnected) {
    bot.sendMessage(chatId, "❌ Please connect your wallet first with /connect");
    return;
  }
  
  let listingId, tokenId;
  
  // Check if input is just a number (could be token ID or listing ID)
  if (/^\d+$/.test(input)) {
    // First try to find listing by token ID
    try {
      const listedFilter = saleContract.filters.Listed();
      const listedEvents = await saleContract.queryFilter(listedFilter, -1500);
      
      // Find listing by token ID
      const matchingEvent = listedEvents.reverse().find(event => 
        event.args && event.args.tokenId.toString() === input
      );
      
      if (matchingEvent) {
        listingId = matchingEvent.args.listingId.toString();
        tokenId = matchingEvent.args.tokenId.toString();
        console.log('🔍 Found by token ID - listingId:', listingId, 'tokenId:', tokenId);
      } else {
        // Assume it's a listing ID
        listingId = input;
        console.log('🔍 Using as listing ID:', listingId);
        // We'll get token ID from listing details
      }
    } catch (e) {
      listingId = input; // Fallback to treating as listing ID
    }
  } else {
    return bot.sendMessage(chatId, "❌ Please provide a valid Token ID or Listing ID number");
  }
  
  const loadingMsg = await bot.sendMessage(chatId, `🛒 Attempting to purchase NFT...\n🔍 Checking listing details...`);
  
  try {
    // Get listing details (handle both old and new contract methods)
    let listing;
    try {
      // First try with the correct method name
      listing = await saleContract.getListing ? 
        await saleContract.getListing(listingId) :
        await saleContract.getListingById(listingId);
    } catch (e) {
      // If that fails, try to get listing info from events
      const listedFilter = saleContract.filters.Listed();
      const listedEvents = await saleContract.queryFilter(listedFilter, -1500);
      
      const listingEvent = listedEvents.find(event => 
        event.args && event.args.listingId.toString() === listingId
      );
      
      if (!listingEvent) {
        throw new Error("Listing not found");
      }
      
      listing = {
        nft: listingEvent.args.nft,
        tokenId: listingEvent.args.tokenId,
        seller: listingEvent.args.seller,
        price: listingEvent.args.price,
        active: true // We assume it's active until proven otherwise
      };
      tokenId = listing.tokenId.toString();
    }
    
    if (!tokenId) {
      tokenId = listing.tokenId.toString();
    }
    
    bot.editMessageText(
      `📋 NFT Purchase Details:\n🎨 Token ID: ${tokenId}\n💰 Price: ${ethers.formatEther(listing.price)} SEI\n🔍 Validating listing...`,
      { chat_id: chatId, message_id: loadingMsg.message_id }
    );
    
    // Check if listing is still active by verifying NFT is in escrow
    const currentOwner = await minterContract.ownerOf(tokenId);
    const isInEscrow = currentOwner.toLowerCase() === MEME_SALE_ADDRESS.toLowerCase();
    
    if (!isInEscrow) {
      return bot.editMessageText(
        `❌ This NFT is no longer available for purchase.\n\n🎨 Token ID: ${tokenId}\n📄 Status: Already sold or unlisted\n\n💡 Use /list to see available NFTs`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
    }
    
    // Check if user is trying to buy their own listing
    const isOwnListing = listing.seller.toLowerCase() === session.walletAddress.toLowerCase();
    
    if (isOwnListing) {
      return bot.editMessageText(
        `🚫 You cannot buy your own NFT listing!\n\n🎨 Token ID: ${tokenId}\n💰 Price: ${ethers.formatEther(listing.price)} SEI\n\n💡 **This is a security feature to prevent:**\n• Artificial price manipulation\n• Fake trading volume\n• Market manipulation\n\n🤝 **To complete a sale:**\n• Share this listing with friends\n• Post on social media\n• Wait for genuine buyers\n\n📋 Use /list to see other available NFTs you can purchase`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
    }
    
    // Check bot balance
    const botBalance = await provider.getBalance(wallet.address);
    if (botBalance < listing.price) {
      return bot.editMessageText(
        `❌ Insufficient balance for purchase\n\n💰 Required: ${ethers.formatEther(listing.price)} SEI\n💵 Available: ${ethers.formatEther(botBalance)} SEI\n\n💡 The bot needs more SEI to complete this purchase.`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
    }
    
    // All checks passed - proceed with purchase
    bot.editMessageText(
      `✅ All checks passed! Executing purchase...\n\n🎨 Token ID: ${tokenId}\n💰 Paying: ${ethers.formatEther(listing.price)} SEI\n⏳ Processing transaction...`,
      { chat_id: chatId, message_id: loadingMsg.message_id }
    );
    
    // Debug: Log the parameters being used
    console.log('🔍 Buy Transaction Parameters:');
    console.log('listingId:', listingId, 'type:', typeof listingId);
    console.log('price:', listing.price.toString(), 'type:', typeof listing.price);
    console.log('tokenId:', tokenId, 'type:', typeof tokenId);
    
    // Test function encoding before execution
    try {
      const functionData = saleContract.interface.encodeFunctionData('buy', [listingId]);
      console.log('✅ Function encoded successfully:', functionData);
    } catch (encodingError) {
      console.log('❌ Function encoding failed:', encodingError.message);
      return bot.editMessageText(
        `❌ Function encoding failed: ${encodingError.message}`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
    }
    
    // Use the WORKING approach from direct test
    console.log('🚀 Using working direct contract call approach...');
    
    // Create a new contract instance connected to the wallet (like in working test)
    const workingSaleContract = new ethers.Contract(
      '0xFf0Fad274f08551890F8Ab7f1D5B719520FFcd51', 
      [
        "function buy(uint256 listingId) external payable",
        "function listings(uint256) public view returns (address, uint256, address, uint256, bool, uint256)"
      ], 
      wallet
    );
    
    // First estimate gas
    const gasEstimate = await workingSaleContract.buy.estimateGas(listingId, {
      value: listing.price
    });
    console.log('Gas estimate:', gasEstimate.toString());
    
    // Execute the buy transaction using the working approach
    const buyTx = await workingSaleContract.buy(listingId, {
      value: listing.price,
      gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
    });
    
    bot.editMessageText(
      `📝 Purchase transaction submitted!\n🔗 Transaction: ${buyTx.hash}\n⏳ Waiting for blockchain confirmation...`,
      { chat_id: chatId, message_id: loadingMsg.message_id }
    );
    
    // Wait for transaction confirmation
    const receipt = await buyTx.wait();
    
    // NFT goes to bot wallet first (msg.sender), so we need to transfer it to user
    console.log('🔄 NFT purchased, now transferring to user wallet...');
    
    bot.editMessageText(
      `✅ Purchase confirmed! Transferring NFT to your wallet...\n\n🎨 Token ID: ${tokenId}\n💰 Price Paid: ${ethers.formatEther(listing.price)} SEI\n🔗 Transaction: ${buyTx.hash}\n⏳ Transferring to: ${session.walletAddress}`,
      { chat_id: chatId, message_id: loadingMsg.message_id }
    );
    
    // Transfer NFT from bot wallet to user wallet
    const transferTx = await minterContract.connect(wallet).transferFrom(
      wallet.address,
      session.walletAddress,
      tokenId
    );
    
    console.log('🔄 Transfer transaction:', transferTx.hash);
    
    bot.editMessageText(
      `🔄 NFT transfer submitted...\n\n🎨 Token ID: ${tokenId}\n🔗 Purchase TX: ${buyTx.hash}\n🔗 Transfer TX: ${transferTx.hash}\n⏳ Waiting for transfer confirmation...`,
      { chat_id: chatId, message_id: loadingMsg.message_id }
    );
    
    // Wait for transfer confirmation
    const transferReceipt = await transferTx.wait();
    
    // Verify final ownership
    const finalOwner = await minterContract.ownerOf(tokenId);
    const transferSuccess = finalOwner.toLowerCase() === session.walletAddress.toLowerCase();
    
    if (transferSuccess) {
      bot.editMessageText(
        `🎉 NFT Purchase & Transfer Successful!\n\n🎨 Token ID: ${tokenId}\n💰 Price Paid: ${ethers.formatEther(listing.price)} SEI\n🔗 Purchase TX: ${buyTx.hash}\n🔗 Transfer TX: ${transferTx.hash}\n⛽ Total Gas Used: ${BigInt(receipt.gasUsed) + BigInt(transferReceipt.gasUsed)}\n👤 Final Owner: ${session.walletAddress}\n\n✅ The NFT is now in your wallet!\n💡 Import the NFT contract in MetaMask:\n📋 Contract: 0xF561B8856DB1d99874dBfFf31321C1D8d7d2E469\n🆔 Token ID: ${tokenId}\n\n📋 Use /list to explore more NFTs`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
    } else {
      bot.editMessageText(
        `⚠️ Purchase successful but transfer failed!\n\n🎨 Token ID: ${tokenId}\n💰 Price Paid: ${ethers.formatEther(listing.price)} SEI\n🔗 Purchase TX: ${buyTx.hash}\n🔗 Transfer TX: ${transferTx.hash}\n👤 Current Owner: ${finalOwner}\n\n💡 The NFT was purchased but couldn't be transferred to your wallet. Contact support.`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
    }
    
  } catch (error) {
    console.error('Buy error:', error);
    
    let errorMsg = '❌ Purchase failed: ';
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('incorrect payment amount')) {
      errorMsg += 'Payment amount mismatch - listing price may have changed';
    } else if (errorMessage.includes('listing not active')) {
      errorMsg += 'Listing is no longer active';
    } else if (errorMessage.includes('cannot buy own listing')) {
      errorMsg += 'You cannot buy your own listing (this prevents market manipulation)';
    } else if (errorMessage.includes('insufficient funds')) {
      errorMsg += 'Insufficient SEI balance';
    } else if (errorMessage.includes('listing not found')) {
      errorMsg += 'Listing not found - it may have been sold or removed';
    } else if (errorMessage.includes('execution reverted')) {
      errorMsg += 'Smart contract rejected the transaction - NFT may already be sold';
    } else {
      errorMsg += error.reason || error.message || 'Unknown error occurred';
    }
    
    errorMsg += `\n\n💡 Try:\n• /list - See current available NFTs\n• Check if the NFT is still for sale\n• Verify you have enough SEI balance`;
    
    bot.editMessageText(errorMsg, {
      chat_id: chatId,
      message_id: loadingMsg.message_id
    });
  }
});

// /list command
bot.onText(/\/list/, async (msg) => {
  const chatId = msg.chat.id;
  const session = getUserSession(chatId);
  
  if (!session.walletConnected) {
    bot.sendMessage(chatId, "❌ Please connect your wallet first with /connect");
    return;
  }
  
  const loadingMsg = await bot.sendMessage(chatId, "📋 Loading NFT marketplace...");
  
  try {
    // Query Listed events from the contract instead of getListingById
    const listedFilter = saleContract.filters.Listed();
    const listedEvents = await saleContract.queryFilter(listedFilter, -1500); // Last 1500 blocks (within limit)
    
    console.log(`Found ${listedEvents.length} Listed events`);
    
    const activeListings = [];
    
    // Process events to find active listings
    for (const event of listedEvents.slice(-20)) { // Get last 20 events
      try {
        const args = event.args;
        if (args) {
          const listingId = args.listingId.toString();
          const tokenId = args.tokenId.toString();
          const seller = args.seller;
          const price = ethers.formatEther(args.price);
          
          // Check if this listing is still active by checking if token is still in MemeSale
          try {
            const tokenOwner = await minterContract.ownerOf(tokenId);
            if (tokenOwner.toLowerCase() === MEME_SALE_ADDRESS.toLowerCase()) {
              activeListings.push({
                listingId,
                tokenId,
                seller,
                price,
                nftContract: args.nft
              });
            }
          } catch (e) {
            // Token might not exist or be sold already
          }
        }
      } catch (error) {
        console.log('Error processing Listed event:', error.message);
      }
    }
    
    if (activeListings.length === 0) {
      bot.editMessageText(
        "📋 No NFTs currently listed for sale. Use /trending and /mint to create some!",
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
      return;
    }
    
    let listMessage = `🏪 NFT Marketplace\n\n`;
    listMessage += `Found ${activeListings.length} NFT(s) for sale:\n\n`;
    
    activeListings.forEach((listing, index) => {
      listMessage += `NFT #${index + 1}\n`;
      listMessage += `🎨 Token ID: ${listing.tokenId}\n`;
      listMessage += `� Listing ID: ${listing.listingId}\n`;
      listMessage += `�💰 Price: ${listing.price} SEI\n`;
      listMessage += `👤 Seller: ${listing.seller.substring(0, 10)}...\n`;
      
      // Check if it's the user's own listing
      if (listing.seller.toLowerCase() === wallet.address.toLowerCase()) {
        listMessage += `🏷️ Status: Your listing\n`;
      } else {
        listMessage += `🛒 Buy: /buy ${listing.tokenId}\n`;
      }
      listMessage += `\n`;
    });
    
    listMessage += `💡 Use /buy TOKEN_ID to purchase any NFT!`;
    
    bot.editMessageText(listMessage, {
      chat_id: chatId,
      message_id: loadingMsg.message_id
    });
    
  } catch (error) {
    console.error('Error listing NFTs:', error);
    bot.editMessageText(
      `❌ Error loading marketplace: ${error.message}`,
      { chat_id: chatId, message_id: loadingMsg.message_id }
    );
  }
});

// /balance command
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  const session = getUserSession(chatId);
  
  if (!session.walletConnected) {
    bot.sendMessage(chatId, "❌ Please connect your wallet first with /connect");
    return;
  }
  
  try {
    // Show bot wallet balance (where NFTs are minted)
    const botBalance = await provider.getBalance(wallet.address);
    const botBalanceInEth = ethers.formatEther(botBalance);
    
    let balanceMessage = `💰 Wallet Information

👤 Your Connected Wallet: ${session.walletAddress}
🤖 Bot Wallet (minting): ${wallet.address}
💵 Bot Balance: ${botBalanceInEth} SEI
🌐 Network: SEI Testnet

ℹ️ How it works:
• Your wallet address is saved for tracking
• NFTs are minted to the bot wallet for efficiency
• You can track your NFTs on the marketplace
• All transactions are handled by the bot

${parseFloat(botBalanceInEth) < 0.01 ? 
  "⚠️ Low bot balance! NFT minting may fail." : 
  "✅ Sufficient balance for minting!"
}`;

    // Try to get user's wallet balance too (optional)
    try {
      const userBalance = await provider.getBalance(session.walletAddress);
      const userBalanceInEth = ethers.formatEther(userBalance);
      balanceMessage += `\n\n👤 Your Wallet Balance: ${userBalanceInEth} SEI`;
    } catch (e) {
      balanceMessage += `\n\n👤 Your Wallet: Connected (balance check unavailable)`;
    }
    
    bot.sendMessage(chatId, balanceMessage);
    
  } catch (error) {
    bot.sendMessage(chatId, `❌ Error checking balance: ${error.message}`);
  }
});

// /userbuy command - User purchases with their own wallet
bot.onText(/\/userbuy (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const session = getUserSession(chatId);
  
  if (!session.walletConnected) {
    bot.sendMessage(chatId, "❌ Please connect your wallet first with /connect");
    return;
  }
  
  const input = match[1].trim();
  
  // Parse input: tokenId privateKey
  const parts = input.split(' ');
  if (parts.length !== 2) {
    bot.sendMessage(chatId, 
      `❌ Invalid format. Use: /userbuy TOKEN_ID PRIVATE_KEY\n\n` +
      `Example: /userbuy 44 0x5e30b9608924357fabe2779f883cd32010512320441421f95e117723630cb973\n\n` +
      `⚠️ Your private key is only used temporarily for this transaction and is not stored!`
    );
    return;
  }
  
  const [tokenId, privateKey] = parts;
  
  // Validate private key format
  if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
    bot.sendMessage(chatId, "❌ Invalid private key format. It should start with '0x' and be 64 characters long.");
    return;
  }
  
  const loadingMsg = await bot.sendMessage(chatId, "🔍 Processing your purchase...");
  
  try {
    // Create user wallet from private key
    const userWallet = new ethers.Wallet(privateKey, provider);
    
    // Verify the private key matches the connected wallet
    if (userWallet.address.toLowerCase() !== session.walletAddress.toLowerCase()) {
      bot.editMessageText(
        `❌ Private key doesn't match connected wallet!\n\n` +
        `Connected: ${session.walletAddress}\n` +
        `Private key for: ${userWallet.address}\n\n` +
        `Please use the correct private key for your connected wallet.`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
      return;
    }
    
    // Find the listing by token ID
    const listedFilter = saleContract.filters.Listed();
    const listedEvents = await saleContract.queryFilter(listedFilter, -1500);
    
    const matchingEvent = listedEvents.reverse().find(event => 
      event.args && event.args.tokenId.toString() === tokenId
    );
    
    if (!matchingEvent) {
      bot.editMessageText(
        `❌ No active listing found for Token ID ${tokenId}`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
      return;
    }
    
    const listingId = matchingEvent.args.listingId;
    const listingPrice = matchingEvent.args.price;
    const seller = matchingEvent.args.seller;
    
    console.log(`🛒 User ${userWallet.address} buying Token ${tokenId} (Listing ${listingId}) for ${ethers.formatEther(listingPrice)} SEI`);
    
    // Check if user is trying to buy their own listing
    if (seller.toLowerCase() === userWallet.address.toLowerCase()) {
      bot.editMessageText(
        `❌ You cannot buy your own listing!\n\nToken ${tokenId} is listed by you.`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
      return;
    }
    
    // Check user balance
    const userBalance = await provider.getBalance(userWallet.address);
    const totalCost = listingPrice + ethers.parseEther('0.01'); // Price + gas buffer
    
    if (userBalance < totalCost) {
      bot.editMessageText(
        `❌ Insufficient balance!\n\n` +
        `Required: ${ethers.formatEther(totalCost)} SEI\n` +
        `Your balance: ${ethers.formatEther(userBalance)} SEI\n` +
        `Need: ${ethers.formatEther(totalCost - userBalance)} more SEI`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
      return;
    }
    
    // Create user's sale contract instance
    const userSaleContract = new ethers.Contract(MEME_SALE_ADDRESS, MEME_SALE_ABI, userWallet);
    
    bot.editMessageText(
      `🚀 Purchasing NFT with your wallet...\n\n` +
      `🎨 Token ID: ${tokenId}\n` +
      `💰 Price: ${ethers.formatEther(listingPrice)} SEI\n` +
      `👤 Buyer: ${userWallet.address}\n` +
      `📦 Seller: ${seller.substring(0, 10)}...`,
      { chat_id: chatId, message_id: loadingMsg.message_id }
    );
    
    // Execute the purchase with user's wallet
    const buyTx = await userSaleContract.buy(listingId, {
      value: listingPrice,
      gasLimit: 300000
    });
    
    console.log('🚀 User buy transaction sent:', buyTx.hash);
    
    const receipt = await buyTx.wait();
    console.log('✅ User buy transaction confirmed in block:', receipt.blockNumber);
    
    // Verify ownership transfer
    const finalOwner = await minterContract.ownerOf(tokenId);
    const transferSuccess = finalOwner.toLowerCase() === userWallet.address.toLowerCase();
    
    if (transferSuccess) {
      bot.editMessageText(
        `🎉 Purchase Successful!\n\n` +
        `🎨 Token ID: ${tokenId}\n` +
        `💰 Price: ${ethers.formatEther(listingPrice)} SEI\n` +
        `🔗 Transaction: ${buyTx.hash}\n` +
        `⛽ Gas Used: ${receipt.gasUsed}\n` +
        `👤 Owner: ${userWallet.address}\n\n` +
        `✅ The NFT is now in your wallet!\n\n` +
        `💡 Import in MetaMask:\n` +
        `📋 Contract: ${MEME_MINTER_ADDRESS}\n` +
        `🆔 Token ID: ${tokenId}`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
    } else {
      bot.editMessageText(
        `⚠️ Purchase completed but ownership verification failed.\n\n` +
        `🔗 Transaction: ${buyTx.hash}\n` +
        `Current owner: ${finalOwner}\n\n` +
        `Please check your wallet manually.`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
    }
    
  } catch (error) {
    console.error('❌ User buy error:', error);
    
    let errorMsg = '❌ Purchase failed: ';
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('cannot buy own listing')) {
      errorMsg += 'You cannot buy your own listing';
    } else if (errorMessage.includes('insufficient funds')) {
      errorMsg += 'Insufficient SEI balance for purchase + gas fees';
    } else if (errorMessage.includes('listing not active')) {
      errorMsg += 'Listing is no longer active';
    } else if (errorMessage.includes('execution reverted')) {
      errorMsg += 'Smart contract rejected the transaction';
    } else {
      errorMsg += error.reason || error.message || 'Unknown error occurred';
    }
    
    bot.editMessageText(errorMsg, {
      chat_id: chatId,
      message_id: loadingMsg.message_id
    });
  }
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `🎭 Viral Meme NFT Bot - Help

Main Commands:
🔗 /connect - Connect your wallet
🔌 /disconnect - Disconnect current wallet
📈 /trending - Find viral memes
🎨 /mint NUMBER - Mint specific meme as NFT
🎨 /mint all - Mint all trending memes
🛒 /buy TOKEN_ID - Buy NFT (bot pays, transfers to you)
💳 /userbuy TOKEN_ID PRIVATE_KEY - Buy NFT with your own wallet
 /list - View marketplace listings
💰 /balance - Check wallet balance
❓ /help - Show this help

How to Use:
1. Start with /connect to setup your wallet
2. Send your SEI wallet address when prompted
3. Use /trending to discover viral memes
4. Choose memes to mint with /mint 1, /mint 2, etc.
5. Browse and buy NFTs with /list and /userbuy

Example Flow:
/connect → Send wallet → /trending → /mint 1 → /list → /userbuy 46 0x5e30b9608924357fabe2779f883cd32010512320441421f95e117723630cb973

🚀 All NFTs are minted on SEI testnet blockchain!`;
  
  bot.sendMessage(chatId, helpMessage);
});



// Handle wallet address input
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const session = getUserSession(chatId);
  
  // Skip if it's a command or not awaiting wallet address
  if (!text || text.startsWith('/') || !session.awaitingWalletAddress) {
    return;
  }
  
  // Validate wallet address format (Ethereum-style address)
  const walletRegex = /^0x[a-fA-F0-9]{40}$/;
  
  if (!walletRegex.test(text)) {
    bot.sendMessage(chatId, `❌ Invalid wallet address format!

Please send a valid SEI wallet address that looks like:
0x1234567890123456789012345678901234567890

Make sure it:
• Starts with "0x"
• Has exactly 42 characters
• Contains only letters (a-f) and numbers (0-9)

Try again:`);
    return;
  }
  
  // Save the wallet address
  session.walletAddress = text;
  session.walletConnected = true;
  session.awaitingWalletAddress = false;
  
  const successMessage = `✅ Wallet Connected Successfully!

🏦 Your wallet: ${text}
🌐 Network: SEI Testnet
💰 Use /balance to check your balance

⚠️ Important Notes:
• NFTs will be minted TO the bot wallet for gas efficiency
• You can track and trade them on the marketplace
• Use /trending to start discovering viral memes!

Ready to mint some viral meme NFTs? 🚀`;

  bot.sendMessage(chatId, successMessage);
});



// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('🤖 Viral Meme NFT Telegram Bot started!');
console.log(`🔗 Bot wallet: ${wallet.address}`);
console.log(`🌐 Network: SEI Testnet (Chain ID: ${CHAIN_ID})`);
console.log(`📊 Max NFT images per trending search: ${MAX_NFT_IMAGES}`);
console.log('🚀 Ready to serve users!');
