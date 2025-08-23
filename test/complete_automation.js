import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { ethers } from "ethers";

// ========== CONFIG ==========
const PINATA_API_KEY = "4d0007f6a472a4820cb0";
const PINATA_SECRET_API_KEY = "4956b045ca7470f4c39dbd7dcdd2908d1a874cfb0096d7d32c4a8aafe246ec35";

const PRIVATE_KEY = "dafe859dd0005b78473404725b7a32d3dbc4a7249a4ff8bc824626580f1f28d9";
const MEME_MINTER_ADDRESS = "0xF561B8856DB1d99874dBfFf31321C1D8d7d2E469";
const MEME_SALE_ADDRESS = "0xFf0Fad274f08551890F8Ab7f1D5B719520FFcd51"; // Working MemeSale contract

// NFT listing configuration
const DEFAULT_NFT_PRICE = "0.01"; // Price in SEI for listing NFTs
const TREND_HASH_PREFIX = "viral-meme-"; // Prefix for trend hash

const SEI_RPC = "https://evm-rpc-testnet.sei-apis.com";
const NETWORK_CONFIG = {
  name: "SEI Testnet",
  rpcUrl: SEI_RPC,
  chainId: 713715,
  currency: "SEI",
  blockExplorer: "https://seitrace.com"
};

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

// ========== PINATA FUNCTIONS ==========

async function uploadImageToPinata(filePath) {
  console.log(`    📤 Uploading image to Pinata IPFS...`);
  
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

  const imageHash = res.data.IpfsHash;
  const imageURL = `ipfs://${imageHash}`;
  
  console.log(`    ✅ Image uploaded! IPFS Hash: ${imageHash}`);
  return { hash: imageHash, url: imageURL };
}

async function uploadMetadataToPinata(imageData, nftDetails) {
  console.log(`    📝 Creating NFT metadata...`);
  
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

  console.log(`    📤 Uploading metadata to Pinata IPFS...`);
  
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

  const metadataHash = res.data.IpfsHash;
  const metadataURL = `ipfs://${metadataHash}`;
  
  console.log(`    ✅ Metadata uploaded! IPFS Hash: ${metadataHash}`);
  return { hash: metadataHash, url: metadataURL, metadata };
}

// ========== BLOCKCHAIN FUNCTIONS ==========

async function mintNFT(metadataURL, nftDetails, wallet, minterContract) {
  const trendHash = `${TREND_HASH_PREFIX}${Date.now()}-${nftDetails.template.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  console.log(`    🎨 Minting NFT "${nftDetails.name}" on SEI...`);
  console.log(`    🏷️  Trend Hash: ${trendHash}`);
  
  const tx = await minterContract.mintTo(wallet.address, metadataURL, trendHash, {
    gasLimit: 500000,
  });
  
  console.log(`    📝 Transaction hash: ${tx.hash}`);
  console.log(`    🔍 View on SEI Explorer: ${NETWORK_CONFIG.blockExplorer}/tx/${tx.hash}`);

  console.log(`    ⏳ Waiting for confirmation...`);
  const receipt = await tx.wait();
  
  // Parse the Minted event to get token ID
  let tokenId = null;
  for (const log of receipt.logs) {
    try {
      const parsedLog = minterContract.interface.parseLog(log);
      if (parsedLog && parsedLog.name === 'Minted') {
        tokenId = parsedLog.args.tokenId.toString();
        console.log(`    🎯 Found Minted event: Token ID ${tokenId}`);
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
      console.log(`    ⚠️ Using fallback method: Token ID ${tokenId} (current-1)`);
    } catch (e) {
      console.log(`    ⚠️  Could not determine token ID, using placeholder`);
      tokenId = "unknown";
    }
  }
  
  console.log(`    ✅ NFT minted successfully! Token ID: ${tokenId}, Gas used: ${receipt.gasUsed}`);
  
  return {
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `${NETWORK_CONFIG.blockExplorer}/tx/${tx.hash}`,
    tokenId: tokenId,
    trendHash: trendHash
  };
}

async function listNFT(tokenId, price, wallet, minterContract, saleContract) {
  console.log(`    🏪 Listing NFT Token ID ${tokenId} on marketplace...`);
  
  // Check if MemeSale contract is approved for all NFTs
  console.log(`    🔐 Checking approval for all NFTs...`);
  const isApprovedForAll = await minterContract.isApprovedForAll(wallet.address, MEME_SALE_ADDRESS);
  
  if (!isApprovedForAll) {
    console.log(`    ✅ Setting approval for all NFTs to MemeSale contract...`);
    const approvalTx = await minterContract.setApprovalForAll(MEME_SALE_ADDRESS, true, {
      gasLimit: 100000,
    });
    await approvalTx.wait();
    console.log(`    ✅ Approval for all confirmed: ${approvalTx.hash}`);
  } else {
    console.log(`    ✅ Already approved for all NFTs`);
  }
  
  // Convert price to wei
  const priceInWei = ethers.parseEther(price);
  console.log(`    💰 Listing price: ${price} SEI (${priceInWei.toString()} wei)`);
  
  // List the NFT on MemeSale marketplace
  console.log(`    📋 Calling MemeSale.list(${MEME_MINTER_ADDRESS}, ${tokenId}, ${priceInWei.toString()})...`);
  const listTx = await saleContract.list(MEME_MINTER_ADDRESS, tokenId, priceInWei, {
    gasLimit: 300000,
  });
  
  console.log(`    📝 Listing transaction: ${listTx.hash}`);
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
      listingId = (currentListingId - 1n).toString(); // Previous listing ID
    } catch (e) {
      console.log(`    ⚠️  Could not determine listing ID, using placeholder`);
      listingId = "unknown";
    }
  }
  
  console.log(`    🎉 NFT listed successfully! Listing ID: ${listingId}, Price: ${price} SEI`);
  console.log(`    🔍 View listing: ${NETWORK_CONFIG.blockExplorer}/tx/${listTx.hash}`);
  
  return {
    listingId: listingId,
    price: price,
    priceInWei: priceInWei.toString(),
    transactionHash: listTx.hash,
    explorerUrl: `${NETWORK_CONFIG.blockExplorer}/tx/${listTx.hash}`
  };
}

// ========== UTILITY FUNCTIONS ==========

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
  const folderPath = "./results/nft_images"; // Using the nft_images folder with generated NFT images
  
  // Check if folder exists
  if (!fs.existsSync(folderPath)) {
    console.log(`❌ NFT images folder not found: ${folderPath}`);
    return;
  }
  
  // Get all meme images
  const files = fs.readdirSync(folderPath).filter(file => 
    file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
  );

  if (files.length === 0) {
    console.log("❌ No meme images found in the folder");
    return;
  }

  console.log(`🚀 STARTING MINT + LIST AUTOMATION`);
  console.log(`📁 Found ${files.length} meme images to process`);
  console.log(`⚡ Using SEI Network Testnet for minting & listing`);
  console.log(`🌐 IPFS storage via Pinata`);
  console.log(`🎨 MemeMinter: ${MEME_MINTER_ADDRESS}`);
  console.log(`🏪 MemeSale: ${MEME_SALE_ADDRESS}`);
  console.log(`💰 Default listing price: ${DEFAULT_NFT_PRICE} SEI`);
  console.log("=".repeat(60));

  // Setup blockchain connections
  const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const minterContract = new ethers.Contract(MEME_MINTER_ADDRESS, MEME_MINTER_ABI, wallet);
  const saleContract = new ethers.Contract(MEME_SALE_ADDRESS, MEME_SALE_ABI, wallet);

  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} SEI`);
  console.log("");

  let successCount = 0;
  let totalProcessed = 0;
  const results = [];

  // Process only first 3 images for testing
  const testFiles = files.slice(0, 3);
  console.log(`🧪 Processing first ${testFiles.length} images for testing...`);
  console.log("");

  for (const file of testFiles) {
    const filePath = path.join(folderPath, file);
    totalProcessed++;

    console.log(`📦 Processing ${totalProcessed}/${testFiles.length}: ${file}`);
    console.log("-".repeat(50));
    
    try {
      // Step 1: Upload image to Pinata IPFS
      const imageData = await uploadImageToPinata(filePath);
      
      // Step 2: Create NFT details
      const nftDetails = createNFTDetails(filePath);
      
      // Step 3: Create and upload metadata to Pinata IPFS
      const metadataData = await uploadMetadataToPinata(imageData, nftDetails);
      
      // Step 4: Mint NFT on blockchain
      console.log(`    ⛓️  Minting NFT on SEI blockchain...`);
      const mintData = await mintNFT(metadataData.url, nftDetails, wallet, minterContract);
      
      // Step 5: Wait longer for blockchain to finalize the mint
      console.log(`    ⏱️  Waiting 15 seconds for blockchain to finalize mint...`);
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      // Verify the token exists before listing with retry logic
      let tokenExists = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!tokenExists && retryCount < maxRetries) {
        try {
          const tokenOwner = await minterContract.ownerOf(mintData.tokenId);
          console.log(`    ✅ Token ${mintData.tokenId} owner confirmed: ${tokenOwner.slice(0, 10)}...`);
          tokenExists = true;
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`    ⏳ Token ${mintData.tokenId} not ready yet, retrying in 10 seconds... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          } else {
            console.log(`    ❌ Token ${mintData.tokenId} doesn't exist after ${maxRetries} attempts, skipping listing...`);
            continue;
          }
        }
      }
      
      if (!tokenExists) {
        continue;
      }
      
      // Step 6: List NFT on marketplace
      console.log(`    🏪 Listing NFT on MemeSale marketplace...`);
      const listData = await listNFT(mintData.tokenId, DEFAULT_NFT_PRICE, wallet, minterContract, saleContract);
      
      // Store result
      const result = {
        file: file,
        nftDetails: nftDetails,
        imageHash: imageData.hash,
        imageURL: imageData.url,
        metadataHash: metadataData.hash,
        metadataURL: metadataData.url,
        tokenId: mintData.tokenId,
        trendHash: mintData.trendHash,
        mintTransactionHash: mintData.transactionHash,
        mintExplorerUrl: mintData.explorerUrl,
        listingId: listData.listingId,
        listingPrice: listData.price,
        listTransactionHash: listData.transactionHash,
        listExplorerUrl: listData.explorerUrl,
        success: true
      };
      
      results.push(result);
      successCount++;
      
      console.log(`    🎉 SUCCESS! Minted & Listed "${nftDetails.template}"`);
      console.log(`    🎨 Token ID: ${mintData.tokenId}`);
      console.log(`    🏪 Listing ID: ${listData.listingId}`);
      console.log(`    💰 Price: ${listData.price} SEI`);
      
      // Add delay between operations
      if (totalProcessed < testFiles.length) {
        console.log(`    ⏱️  Waiting 8 seconds before next mint+list...`);
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
      
    } catch (error) {
      console.error(`    ❌ Error processing ${file}:`, error.message);
      
      results.push({
        file: file,
        error: error.message,
        success: false
      });
      
      // Continue with next file
      continue;
    }
  }
  
  // Save results to file
  const resultsFile = "./mint_and_list_results.json";
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 MINT + LIST AUTOMATION COMPLETED!");
  console.log("=".repeat(60));
  console.log(`📊 FINAL RESULTS:`);
  console.log(`  • Total processed: ${totalProcessed}`);
  console.log(`  • Successfully minted & listed: ${successCount}`);
  console.log(`  • Failed: ${totalProcessed - successCount}`);
  console.log(`  • Success rate: ${((successCount/totalProcessed)*100).toFixed(1)}%`);
  
  if (successCount > 0) {
    console.log(`\n🏆 SUCCESSFULLY MINTED & LISTED NFTs:`);
    results.filter(r => r.success).forEach((result, index) => {
      console.log(`  ${index + 1}. "${result.nftDetails.template}"`);
      console.log(`     🎨 Token ID: ${result.tokenId} | Listing ID: ${result.listingId}`);
      console.log(`     💰 Price: ${result.listingPrice} SEI`);
      console.log(`     🌐 Mint: ${result.mintExplorerUrl}`);
      console.log(`     🏪 List: ${result.listExplorerUrl}`);
      console.log(`     📝 Metadata: ${result.metadataURL}`);
      console.log(`     🖼️  Image: ${result.imageURL}`);
    });
  }
  
  console.log(`\n📁 Detailed results saved to: ${resultsFile}`);
  console.log(`🚀 Your viral meme NFTs are now minted and listed on SEI testnet!`);
  console.log(`🛒 Visit the MemeSale marketplace to see your listings!`);
}

main().catch(console.error);
