import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { ethers } from "ethers";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), 'telegram_bot', '.env') });

// ========== CONFIG FROM ENV ==========
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MEME_MINTER_ADDRESS = process.env.MEME_MINTER_ADDRESS;
const MEME_SALE_ADDRESS = process.env.MEME_SALE_ADDRESS;

// NFT listing configuration
const DEFAULT_NFT_PRICE = process.env.DEFAULT_NFT_PRICE || "0.01";
const TREND_HASH_PREFIX = "viral-meme-";

const SEI_RPC = process.env.SEI_RPC || "https://evm-rpc-testnet.sei-apis.com";
const CHAIN_ID = parseInt(process.env.CHAIN_ID) || 713715;

const NETWORK_CONFIG = {
  name: "SEI Testnet",
  rpcUrl: SEI_RPC,
  chainId: CHAIN_ID,
  currency: "SEI",
  blockExplorer: "https://seitrace.com"
};

// Validate required environment variables
const requiredEnvVars = [
  'PINATA_API_KEY',
  'PINATA_SECRET_API_KEY', 
  'PRIVATE_KEY',
  'MEME_MINTER_ADDRESS',
  'MEME_SALE_ADDRESS'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Minimal ABIs for the contracts
const MEME_MINTER_ABI = [
  "function mintTo(address to, string memory tokenURI, string memory trendHash) public returns (uint256)",
  "function getCurrentTokenId() public view returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function setApprovalForAll(address operator, bool approved) public",
  "function isApprovedForAll(address owner, address operator) public view returns (bool)"
];

const MEME_SALE_ABI = [
  "function list(address nft, uint256 tokenId, uint256 price) public returns (uint256)",
  "function getCurrentListingId() public view returns (uint256)",
  "function paused() public view returns (bool)"
];

// ========== UTILITY FUNCTIONS ==========

async function uploadImageToPinata(filePath) {
  console.log(`📤 Uploading image to IPFS: ${path.basename(filePath)}`);
  
  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));
  
  const filename = path.basename(filePath);
  data.append("pinataMetadata", JSON.stringify({
    name: filename,
    keyvalues: {
      type: "nft-image",
      collection: "viral-memes"
    }
  }));

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        headers: {
          "pinata_api_key": PINATA_API_KEY,
          "pinata_secret_api_key": PINATA_SECRET_API_KEY,
          ...data.getHeaders(),
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const imageHash = res.data.IpfsHash;
    const imageURL = `ipfs://${imageHash}`;
    
    console.log(`✅ Image uploaded to IPFS: ${imageHash}`);
    return { hash: imageHash, url: imageURL };
  } catch (error) {
    console.error(`❌ Failed to upload image to IPFS:`, error.response?.data || error.message);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

async function uploadMetadataToPinata(imageData, nftDetails) {
  console.log(`📝 Creating and uploading NFT metadata...`);
  
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
        value: "Reddit Memes"
      },
      {
        trait_type: "Generation Date",
        value: new Date().toISOString().split('T')[0]
      }
    ],
    external_url: "https://viral-memes-collection.com",
    background_color: "000000"
  };

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      {
        headers: {
          "pinata_api_key": PINATA_API_KEY,
          "pinata_secret_api_key": PINATA_SECRET_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const metadataHash = res.data.IpfsHash;
    const metadataURL = `ipfs://${metadataHash}`;
    
    console.log(`✅ Metadata uploaded to IPFS: ${metadataHash}`);
    return { hash: metadataHash, url: metadataURL, metadata };
  } catch (error) {
    console.error(`❌ Failed to upload metadata to IPFS:`, error.response?.data || error.message);
    throw new Error(`Metadata upload failed: ${error.message}`);
  }
}

async function mintNFT(metadataURL, nftDetails, wallet, minterContract) {
  const trendHash = `${TREND_HASH_PREFIX}${Date.now()}-${nftDetails.template.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  console.log(`🎨 Minting NFT: ${nftDetails.name}`);
  console.log(`🏷️ Trend Hash: ${trendHash}`);

  try {
    const tx = await minterContract.mintTo(wallet.address, metadataURL, trendHash, {
      gasLimit: 500000,
    });
    
    console.log(`📝 Transaction submitted: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    
    if (receipt.status !== 1) {
      throw new Error(`Minting transaction failed with status: ${receipt.status}`);
    }
    
    // Parse the Minted event to get token ID
    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = minterContract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'Minted') {
          tokenId = parsedLog.args.tokenId.toString();
          console.log(`🎯 Found Minted event: Token ID ${tokenId}`);
          break;
        }
      } catch (error) {
        // Skip unparseable logs
      }
    }
    
    // If we couldn't parse the event, get the PREVIOUS token ID (current - 1)
    if (!tokenId) {
      try {
        const currentTokenId = await minterContract.getCurrentTokenId();
        tokenId = (currentTokenId - 1n).toString();
        console.log(`⚠️ Using fallback method: Token ID ${tokenId}`);
      } catch (e) {
        console.log(`⚠️ Could not determine token ID, using timestamp-based ID`);
        tokenId = `unknown-${Date.now()}`;
      }
    }
    
    console.log(`✅ NFT minted successfully! Token ID: ${tokenId}, Gas used: ${receipt.gasUsed}`);
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      explorerUrl: `${NETWORK_CONFIG.blockExplorer}/tx/${tx.hash}`,
      tokenId: tokenId,
      trendHash: trendHash
    };
  } catch (error) {
    console.error(`❌ Minting failed:`, error.message);
    throw new Error(`Minting failed: ${error.message}`);
  }
}

async function listNFT(tokenId, price, wallet, minterContract, saleContract) {
  console.log(`🏪 Listing NFT Token ID ${tokenId} for ${price} SEI...`);
  
  try {
    // Check if MemeSale contract is approved for all NFTs
    console.log(`🔐 Checking approval status...`);
    const isApprovedForAll = await minterContract.isApprovedForAll(wallet.address, MEME_SALE_ADDRESS);
    
    if (!isApprovedForAll) {
      console.log(`✅ Setting approval for all NFTs...`);
      const approvalTx = await minterContract.setApprovalForAll(MEME_SALE_ADDRESS, true, {
        gasLimit: 100000,
      });
      await approvalTx.wait();
      console.log(`✅ Approval confirmed: ${approvalTx.hash}`);
    } else {
      console.log(`✅ Already approved for all NFTs`);
    }
    
    // Convert price to wei
    const priceInWei = ethers.parseEther(price);
    console.log(`💰 Listing price: ${price} SEI (${priceInWei.toString()} wei)`);
    
    // List the NFT on MemeSale marketplace
    console.log(`📋 Submitting listing transaction...`);
    const listTx = await saleContract.list(MEME_MINTER_ADDRESS, tokenId, priceInWei, {
      gasLimit: 300000,
    });
    
    console.log(`📝 Listing transaction submitted: ${listTx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);
    const listReceipt = await listTx.wait();
    
    if (listReceipt.status !== 1) {
      throw new Error(`Listing transaction failed with status: ${listReceipt.status}`);
    }
    
    // Parse the Listed event to get listing ID
    let listingId = null;
    for (const log of listReceipt.logs) {
      try {
        const parsedLog = saleContract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'Listed') {
          listingId = parsedLog.args.listingId.toString();
          console.log(`🎯 Found Listed event: Listing ID ${listingId}`);
          break;
        }
      } catch (error) {
        // Skip unparseable logs
      }
    }
    
    // If we couldn't parse the event, try to get current listing ID
    if (!listingId) {
      try {
        const currentListingId = await saleContract.getCurrentListingId();
        listingId = (currentListingId - 1n).toString();
        console.log(`⚠️ Using fallback method: Listing ID ${listingId}`);
      } catch (e) {
        console.log(`⚠️ Could not determine listing ID, using timestamp-based ID`);
        listingId = `unknown-${Date.now()}`;
      }
    }
    
    console.log(`✅ NFT listed successfully! Listing ID: ${listingId}`);
    console.log(`🔍 View on explorer: ${NETWORK_CONFIG.blockExplorer}/tx/${listTx.hash}`);
    
    return {
      listingId: listingId,
      price: price,
      priceInWei: priceInWei.toString(),
      transactionHash: listTx.hash,
      explorerUrl: `${NETWORK_CONFIG.blockExplorer}/tx/${listTx.hash}`
    };
  } catch (error) {
    console.error(`❌ Listing failed:`, error.message);
    throw new Error(`Listing failed: ${error.message}`);
  }
}

function createNFTDetails(imagePath) {
  const imageName = path.basename(imagePath, path.extname(imagePath));
  
  return {
    name: `Viral Meme NFT #${imageName}`,
    description: `A unique NFT representing a viral meme from the internet culture. This digital collectible captures the essence of meme culture and internet humor. Part of the Viral Memes Collection on SEI blockchain.`,
    template: imageName.replace(/[^a-zA-Z0-9]/g, ' ').trim(),
  };
}

// ========== MAIN FUNCTION ==========

async function main() {
  try {
    console.log(`🚀 Starting single NFT minting process...`);
    console.log(`🌐 Network: ${NETWORK_CONFIG.name} (Chain ID: ${CHAIN_ID})`);
    
    const imagePath = process.argv[2];
    
    if (!imagePath) {
      throw new Error("No image path provided. Usage: node mint_single_nft.js <image_path>");
    }
    
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    console.log(`📁 Processing image: ${path.basename(imagePath)}`);

    // Setup blockchain connections
    console.log(`🔗 Connecting to blockchain...`);
    const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const minterContract = new ethers.Contract(MEME_MINTER_ADDRESS, MEME_MINTER_ABI, wallet);
    const saleContract = new ethers.Contract(MEME_SALE_ADDRESS, MEME_SALE_ABI, wallet);

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} SEI`);
    
    if (balance < ethers.parseEther("0.1")) {
      console.warn(`⚠️ Low wallet balance. You may need more SEI for gas fees.`);
    }

    // Step 1: Upload image to Pinata IPFS
    const imageData = await uploadImageToPinata(imagePath);
    
    // Step 2: Create NFT details
    const nftDetails = createNFTDetails(imagePath);
    console.log(`📄 NFT Details: ${nftDetails.name}`);
    
    // Step 3: Create and upload metadata to Pinata IPFS
    const metadataData = await uploadMetadataToPinata(imageData, nftDetails);
    
    // Step 4: Mint NFT on blockchain
    const mintData = await mintNFT(metadataData.url, nftDetails, wallet, minterContract);
    
    // Step 5: Wait for blockchain to finalize the mint
    console.log(`⏱️ Waiting 15 seconds for blockchain finalization...`);
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Verify the token exists before listing
    console.log(`🔍 Verifying token existence...`);
    let tokenExists = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!tokenExists && retryCount < maxRetries) {
      try {
        const tokenOwner = await minterContract.ownerOf(mintData.tokenId);
        console.log(`✅ Token ${mintData.tokenId} confirmed, owner: ${tokenOwner.slice(0, 10)}...`);
        tokenExists = true;
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`⏳ Token not ready yet, retrying in 10 seconds... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        } else {
          throw new Error(`Token ${mintData.tokenId} doesn't exist after ${maxRetries} attempts. Minting may have failed.`);
        }
      }
    }
    
    // Step 6: List NFT on marketplace
    const listData = await listNFT(mintData.tokenId, DEFAULT_NFT_PRICE, wallet, minterContract, saleContract);
    
    // Output the result in the format expected by the bot
    const result = {
      success: true,
      tokenId: mintData.tokenId,
      listingPrice: DEFAULT_NFT_PRICE,
      listingId: listData.listingId,
      mintTransactionHash: mintData.transactionHash,
      listTransactionHash: listData.transactionHash,
      imageHash: imageData.hash,
      metadataHash: metadataData.hash,
      nftName: nftDetails.name,
      template: nftDetails.template,
      explorerUrl: mintData.explorerUrl,
      listingExplorerUrl: listData.explorerUrl
    };
    
    console.log(`🎉 SUCCESS! NFT minted and listed successfully!`);
    console.log(`🎨 Token ID: ${result.tokenId}`);
    console.log(`🏪 Listing ID: ${result.listingId}`);
    console.log(`💰 Price: ${result.listingPrice} SEI`);
    console.log(`🔗 Mint TX: ${result.explorerUrl}`);
    console.log(`🛒 Listing TX: ${result.listingExplorerUrl}`);
    
    // Output result for bot consumption
    console.log(`🤖 BOT_RESULT: ${JSON.stringify(result)}`);
    
  } catch (error) {
    console.error('❌ Minting process failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    const result = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.log(`🤖 BOT_RESULT: ${JSON.stringify(result)}`);
    process.exit(1);
  }
}

main().catch(console.error);
