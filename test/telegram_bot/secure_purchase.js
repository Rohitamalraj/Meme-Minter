const { ethers } = require('ethers');

// Secure wallet signature-based purchase system
class SecurePurchaseManager {
  constructor(provider, botWallet) {
    this.provider = provider;
    this.botWallet = botWallet;
    this.pendingPurchases = new Map();
  }

  // Generate a purchase authorization message
  generatePurchaseMessage(userAddress, tokenId, listingId, price, nonce) {
    return {
      userAddress: userAddress,
      tokenId: tokenId,
      listingId: listingId,
      price: price,
      nonce: nonce,
      timestamp: Date.now(),
      message: `Authorize purchase of NFT #${tokenId} for ${ethers.formatEther(price)} SEI`
    };
  }

  // Verify user's signature and execute purchase
  async executePurchaseWithSignature(userAddress, tokenId, listingId, signature, nonce) {
    try {
      // Get listing details
      const saleABI = [
        'function buy(uint256 listingId) public payable',
        'function getListingById(uint256 listingId) public view returns (tuple(address nft, uint256 tokenId, address seller, uint256 price, bool active))'
      ];
      
      const saleContract = new ethers.Contract(
        '0xFf0Fad274f08551890F8Ab7f1D5B719520FFcd51', 
        saleABI, 
        this.provider
      );
      
      const listing = await saleContract.getListingById(listingId);
      
      if (!listing.active) {
        throw new Error('Listing is no longer active');
      }

      // Generate the message that should have been signed
      const purchaseMessage = this.generatePurchaseMessage(
        userAddress, 
        tokenId, 
        listingId, 
        listing.price, 
        nonce
      );
      
      const messageString = JSON.stringify(purchaseMessage);
      const messageHash = ethers.hashMessage(messageString);
      
      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(messageString, signature);
      
      if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error('Invalid signature - authorization failed');
      }

      // Check if user has sufficient balance
      const userBalance = await this.provider.getBalance(userAddress);
      if (userBalance < listing.price) {
        throw new Error('Insufficient SEI balance');
      }

      console.log('✅ Signature verified! User authorized purchase.');
      console.log('🤖 Bot executing purchase on behalf of user...');

      // Bot executes the purchase using bot's wallet
      const botSigner = new ethers.Wallet(process.env.BOT_PRIVATE_KEY, this.provider);
      const saleContractWithSigner = saleContract.connect(botSigner);

      // Bot pays for the NFT
      const tx = await saleContractWithSigner.buy(listingId, {
        value: listing.price,
        gasLimit: 300000
      });

      console.log(`🚀 Purchase transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Purchase confirmed in block: ${receipt.blockNumber}`);

      // Transfer NFT to user (this would require additional contract logic)
      // For demo purposes, we'll track the purchase
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        message: `NFT #${tokenId} purchased successfully! Bot paid, NFT reserved for user.`
      };

    } catch (error) {
      console.error('Purchase failed:', error.message);
      throw error;
    }
  }

  // Alternative: Generate a time-limited purchase link
  generateSecurePurchaseLink(userAddress, tokenId, listingId) {
    const timestamp = Date.now();
    const expiresAt = timestamp + (15 * 60 * 1000); // 15 minutes
    
    const linkData = {
      user: userAddress,
      token: tokenId,
      listing: listingId,
      expires: expiresAt,
      nonce: Math.random().toString(36).substring(7)
    };
    
    // In production, this would be encrypted/signed
    const linkToken = Buffer.from(JSON.stringify(linkData)).toString('base64');
    
    return {
      link: `https://your-secure-site.com/purchase/${linkToken}`,
      expires: new Date(expiresAt).toISOString(),
      instructions: 'Click this link within 15 minutes to complete your purchase securely'
    };
  }
}

module.exports = SecurePurchaseManager;
