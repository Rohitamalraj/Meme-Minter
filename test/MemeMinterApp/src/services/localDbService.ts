// Local Database Service for NFT Storage
interface NFTData {
  id: string;
  tokenId?: string;
  name: string;
  description: string;
  image: string;
  ipfsHash: string;
  creator: string;
  owner: string;
  price?: string;
  isListed: boolean;
  createdAt: string;
  listedAt?: string;
  contractAddress: string;
  transactionHash?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface MarketplaceData {
  nfts: NFTData[];
  lastUpdated: string;
}

const LOCAL_STORAGE_KEY = 'meme_nft_marketplace';

export class LocalDbService {
  private static instance: LocalDbService;
  
  public static getInstance(): LocalDbService {
    if (!LocalDbService.instance) {
      LocalDbService.instance = new LocalDbService();
    }
    return LocalDbService.instance;
  }

  // Save NFT data after minting
  public saveNFT(nftData: Omit<NFTData, 'id' | 'createdAt'>): NFTData {
    const id = `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNFT: NFTData = {
      ...nftData,
      id,
      createdAt: new Date().toISOString()
    };

    const data = this.getData();
    data.nfts.push(newNFT);
    data.lastUpdated = new Date().toISOString();
    
    this.saveData(data);
    console.log('NFT saved to local database:', newNFT);
    return newNFT;
  }

  // Update NFT after listing on marketplace
  public updateNFTListing(id: string, price: string, isListed: boolean): boolean {
    const data = this.getData();
    const nftIndex = data.nfts.findIndex(nft => nft.id === id);
    
    if (nftIndex !== -1) {
      data.nfts[nftIndex].price = price;
      data.nfts[nftIndex].isListed = isListed;
      data.nfts[nftIndex].listedAt = isListed ? new Date().toISOString() : undefined;
      data.lastUpdated = new Date().toISOString();
      
      this.saveData(data);
      console.log('NFT listing updated:', data.nfts[nftIndex]);
      return true;
    }
    return false;
  }

  // Get all NFTs
  public getAllNFTs(): NFTData[] {
    return this.getData().nfts;
  }

  // Get NFTs by creator
  public getNFTsByCreator(creatorAddress: string): NFTData[] {
    return this.getData().nfts.filter(nft => 
      nft.creator.toLowerCase() === creatorAddress.toLowerCase()
    );
  }

  // Get NFTs by owner
  public getNFTsByOwner(ownerAddress: string): NFTData[] {
    return this.getData().nfts.filter(nft => 
      nft.owner.toLowerCase() === ownerAddress.toLowerCase()
    );
  }

  // Get listed NFTs for marketplace
  public getListedNFTs(): NFTData[] {
    return this.getData().nfts.filter(nft => nft.isListed);
  }

  // Get NFT by ID
  public getNFTById(id: string): NFTData | null {
    const nft = this.getData().nfts.find(nft => nft.id === id);
    return nft || null;
  }

  // Get NFT by token ID and contract
  public getNFTByTokenId(tokenId: string, contractAddress: string): NFTData | null {
    const nft = this.getData().nfts.find(nft => 
      nft.tokenId === tokenId && 
      nft.contractAddress.toLowerCase() === contractAddress.toLowerCase()
    );
    return nft || null;
  }

  // Update NFT owner after purchase
  public updateNFTOwner(id: string, newOwner: string): boolean {
    const data = this.getData();
    const nftIndex = data.nfts.findIndex(nft => nft.id === id);
    
    if (nftIndex !== -1) {
      data.nfts[nftIndex].owner = newOwner;
      data.nfts[nftIndex].isListed = false; // Remove from marketplace after purchase
      data.nfts[nftIndex].price = undefined;
      data.lastUpdated = new Date().toISOString();
      
      this.saveData(data);
      console.log('NFT owner updated:', data.nfts[nftIndex]);
      return true;
    }
    return false;
  }

  // Search NFTs by name or description
  public searchNFTs(query: string): NFTData[] {
    const lowerQuery = query.toLowerCase();
    return this.getData().nfts.filter(nft => 
      nft.name.toLowerCase().includes(lowerQuery) ||
      nft.description.toLowerCase().includes(lowerQuery)
    );
  }

  // Get marketplace statistics
  public getMarketplaceStats() {
    const nfts = this.getAllNFTs();
    const listedNFTs = this.getListedNFTs();
    
    return {
      totalNFTs: nfts.length,
      listedNFTs: listedNFTs.length,
      totalCreators: new Set(nfts.map(nft => nft.creator.toLowerCase())).size,
      averagePrice: listedNFTs.length > 0 
        ? listedNFTs.reduce((sum, nft) => sum + parseFloat(nft.price || '0'), 0) / listedNFTs.length 
        : 0,
      lastUpdated: this.getData().lastUpdated
    };
  }

  // Clear all data (for development/testing)
  public clearAll(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    console.log('Local database cleared');
  }

  // Export data as JSON (for backup)
  public exportData(): string {
    return JSON.stringify(this.getData(), null, 2);
  }

  // Import data from JSON (for restore)
  public importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.nfts && Array.isArray(data.nfts)) {
        this.saveData(data);
        console.log('Data imported successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Private methods
  private getData(): MarketplaceData {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load local data:', error);
    }
    
    // Return default structure
    return {
      nfts: [],
      lastUpdated: new Date().toISOString()
    };
  }

  private saveData(data: MarketplaceData): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save local data:', error);
    }
  }
}

// Export singleton instance
export const localDb = LocalDbService.getInstance();

// Export types
export type { NFTData, MarketplaceData };
