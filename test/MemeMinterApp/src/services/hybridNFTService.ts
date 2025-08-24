// Hybrid service that combines mock data with real minted NFTs
import { localDb, NFTData } from './localDbService';
import nftSample1 from "@/assets/nft-sample-1.jpg"
import nftSample2 from "@/assets/nft-sample-2.jpg"
import nftSample3 from "@/assets/nft-sample-3.jpg"

// Mock NFT data (keeping original structure with asset images)
const mockNFTs: NFTData[] = [
  {
    id: "mock_1",
    tokenId: "101",
    name: "Cool Cat #001",
    description: "A pixelated cool cat that's ready to take over the blockchain. This OG meme represents the classic internet culture.",
    image: nftSample1,
    ipfsHash: "QmMockCat001",
    creator: "0xPixelArtist123456789012345678901234567890",
    owner: "0xPixelArtist123456789012345678901234567890",
    price: "0.5",
    isListed: true,
    createdAt: "2024-01-15T10:30:00.000Z",
    listedAt: "2024-01-15T10:35:00.000Z",
    contractAddress: import.meta.env.VITE_MEME_MINTER_ADDRESS || "0xMockContract",
    transactionHash: "0xmock001",
    attributes: [
      { trait_type: "Type", value: "Cat Meme" },
      { trait_type: "Rarity", value: "Common" },
      { trait_type: "Style", value: "Pixel Art" }
    ]
  },
  {
    id: "mock_2",
    tokenId: "102",
    name: "Cyber Dog #042",
    description: "A futuristic canine companion from the digital realm. Much wow, very blockchain!",
    image: nftSample2,
    ipfsHash: "QmMockDog042",
    creator: "0xRetroMemer987654321098765432109876543210",
    owner: "0xRetroMemer987654321098765432109876543210",
    price: "0.3",
    isListed: true,
    createdAt: "2024-01-16T14:20:00.000Z",
    listedAt: "2024-01-16T14:25:00.000Z",
    contractAddress: import.meta.env.VITE_MEME_MINTER_ADDRESS || "0xMockContract",
    transactionHash: "0xmock002",
    attributes: [
      { trait_type: "Type", value: "Dog Meme" },
      { trait_type: "Rarity", value: "Rare" },
      { trait_type: "Era", value: "Cyber" }
    ]
  },
  {
    id: "mock_3",
    tokenId: "103",
    name: "Space Pepe #123",
    description: "The legendary Pepe ventures into the cosmos. A rare specimen from the depths of meme space.",
    image: nftSample3,
    ipfsHash: "QmMockPepe123",
    creator: "0xCryptoPixel111111111111111111111111111111",
    owner: "0xCryptoPixel111111111111111111111111111111",
    price: "0.8",
    isListed: true,
    createdAt: "2024-01-17T09:15:00.000Z",
    listedAt: "2024-01-17T09:20:00.000Z",
    contractAddress: import.meta.env.VITE_MEME_MINTER_ADDRESS || "0xMockContract",
    transactionHash: "0xmock003",
    attributes: [
      { trait_type: "Type", value: "Pepe Variant" },
      { trait_type: "Rarity", value: "Legendary" },
      { trait_type: "Location", value: "Space" }
    ]
  },
  {
    id: "mock_4",
    tokenId: "104",
    name: "Pixel Cat #256",
    description: "Another member of the pixel cat family, bringing 8-bit nostalgia to the NFT world.",
    image: nftSample1,
    ipfsHash: "QmMockCat256",
    creator: "0xMemeKing222222222222222222222222222222222",
    owner: "0xMemeKing222222222222222222222222222222222",
    price: "1.2",
    isListed: true,
    createdAt: "2024-01-18T16:45:00.000Z",
    listedAt: "2024-01-18T16:50:00.000Z",
    contractAddress: import.meta.env.VITE_MEME_MINTER_ADDRESS || "0xMockContract",
    transactionHash: "0xmock004",
    attributes: [
      { trait_type: "Type", value: "Cat Meme" },
      { trait_type: "Rarity", value: "Epic" },
      { trait_type: "Number", value: "256" }
    ]
  },
  {
    id: "mock_5",
    tokenId: "105",
    name: "Robo Doge #777",
    description: "The evolution of doge into the cybernetic age. Such technology, much innovation!",
    image: nftSample2,
    ipfsHash: "QmMockRobo777",
    creator: "0xDigitalArt333333333333333333333333333333",
    owner: "0xDigitalArt333333333333333333333333333333",
    price: "0.7",
    isListed: true,
    createdAt: "2024-01-19T11:30:00.000Z",
    listedAt: "2024-01-19T11:35:00.000Z",
    contractAddress: import.meta.env.VITE_MEME_MINTER_ADDRESS || "0xMockContract",
    transactionHash: "0xmock005",
    attributes: [
      { trait_type: "Type", value: "Doge Variant" },
      { trait_type: "Rarity", value: "Ultra Rare" },
      { trait_type: "Enhancement", value: "Robotic" }
    ]
  },
  {
    id: "mock_6",
    tokenId: "106",
    name: "Astro Frog #420",
    description: "A cosmic amphibian ready to hop between galaxies. The ultimate space explorer meme.",
    image: nftSample3,
    ipfsHash: "QmMockFrog420",
    creator: "0xSpaceMemes444444444444444444444444444444",
    owner: "0xSpaceMemes444444444444444444444444444444",
    price: "0.9",
    isListed: true,
    createdAt: "2024-01-20T13:10:00.000Z",
    listedAt: "2024-01-20T13:15:00.000Z",
    contractAddress: import.meta.env.VITE_MEME_MINTER_ADDRESS || "0xMockContract",
    transactionHash: "0xmock006",
    attributes: [
      { trait_type: "Type", value: "Frog Meme" },
      { trait_type: "Rarity", value: "Rare" },
      { trait_type: "Environment", value: "Space" }
    ]
  }
];

export class HybridNFTService {
  private static instance: HybridNFTService;
  
  public static getInstance(): HybridNFTService {
    if (!HybridNFTService.instance) {
      HybridNFTService.instance = new HybridNFTService();
    }
    return HybridNFTService.instance;
  }

  // Get all NFTs (mock + real)
  public getAllNFTs(): NFTData[] {
    const realNFTs = localDb.getAllNFTs();
    return [...mockNFTs, ...realNFTs];
  }

  // Get all listed NFTs for marketplace
  public getListedNFTs(): NFTData[] {
    const realListedNFTs = localDb.getListedNFTs();
    const mockListedNFTs = mockNFTs.filter(nft => nft.isListed);
    return [...mockListedNFTs, ...realListedNFTs];
  }

  // Get NFTs by owner (only check real NFTs for ownership)
  public getNFTsByOwner(ownerAddress: string): NFTData[] {
    const realOwnedNFTs = localDb.getNFTsByOwner(ownerAddress);
    // Check if user owns any mock NFTs (after purchase)
    const ownedMockNFTs = mockNFTs.filter(nft => 
      nft.owner.toLowerCase() === ownerAddress.toLowerCase()
    );
    return [...ownedMockNFTs, ...realOwnedNFTs];
  }

  // Get NFTs by creator (only real NFTs can be created by users)
  public getNFTsByCreator(creatorAddress: string): NFTData[] {
    return localDb.getNFTsByCreator(creatorAddress);
  }

  // Search NFTs (both mock and real)
  public searchNFTs(query: string): NFTData[] {
    const lowerQuery = query.toLowerCase();
    const allNFTs = this.getAllNFTs();
    return allNFTs.filter(nft => 
      nft.name.toLowerCase().includes(lowerQuery) ||
      nft.description.toLowerCase().includes(lowerQuery)
    );
  }

  // Search only listed NFTs
  public searchListedNFTs(query: string): NFTData[] {
    const lowerQuery = query.toLowerCase();
    const listedNFTs = this.getListedNFTs();
    return listedNFTs.filter(nft => 
      nft.name.toLowerCase().includes(lowerQuery) ||
      nft.description.toLowerCase().includes(lowerQuery)
    );
  }

  // Get NFT by ID (check both mock and real)
  public getNFTById(id: string): NFTData | null {
    // Check mock NFTs first
    const mockNFT = mockNFTs.find(nft => nft.id === id);
    if (mockNFT) return mockNFT;
    
    // Check real NFTs
    return localDb.getNFTById(id);
  }

  // Purchase NFT (works for both mock and real)
  public purchaseNFT(nftId: string, buyerAddress: string): boolean {
    // Check if it's a mock NFT
    const mockNFTIndex = mockNFTs.findIndex(nft => nft.id === nftId);
    if (mockNFTIndex !== -1) {
      // Update mock NFT ownership
      mockNFTs[mockNFTIndex].owner = buyerAddress;
      mockNFTs[mockNFTIndex].isListed = false;
      mockNFTs[mockNFTIndex].price = undefined;
      console.log('Mock NFT purchased:', mockNFTs[mockNFTIndex]);
      return true;
    }
    
    // Handle real NFT purchase
    return localDb.updateNFTOwner(nftId, buyerAddress);
  }

  // Save new NFT (only real NFTs)
  public saveNFT(nftData: Omit<NFTData, 'id' | 'createdAt'>): NFTData {
    return localDb.saveNFT(nftData);
  }

  // Update NFT listing (works for both)
  public updateNFTListing(id: string, price: string, isListed: boolean): boolean {
    // Check if it's a mock NFT
    const mockNFTIndex = mockNFTs.findIndex(nft => nft.id === id);
    if (mockNFTIndex !== -1) {
      mockNFTs[mockNFTIndex].price = price;
      mockNFTs[mockNFTIndex].isListed = isListed;
      mockNFTs[mockNFTIndex].listedAt = isListed ? new Date().toISOString() : undefined;
      return true;
    }
    
    // Handle real NFT listing update
    return localDb.updateNFTListing(id, price, isListed);
  }

  // Get marketplace statistics (combined)
  public getMarketplaceStats() {
    const allNFTs = this.getAllNFTs();
    const listedNFTs = this.getListedNFTs();
    
    // Get unique creators (only count real creators since mock ones are fake)
    const realNFTs = localDb.getAllNFTs();
    const uniqueCreators = new Set(realNFTs.map(nft => nft.creator.toLowerCase()));
    
    return {
      totalNFTs: allNFTs.length,
      listedNFTs: listedNFTs.length,
      totalCreators: uniqueCreators.size,
      averagePrice: listedNFTs.length > 0 
        ? listedNFTs.reduce((sum, nft) => sum + parseFloat(nft.price || '0'), 0) / listedNFTs.length 
        : 0,
      lastUpdated: new Date().toISOString(),
      mockNFTs: mockNFTs.length,
      realNFTs: realNFTs.length
    };
  }

  // Clear only real NFTs (keep mock data)
  public clearRealNFTs(): void {
    localDb.clearAll();
    console.log('Cleared real NFTs, mock data preserved');
  }

  // Get mock NFTs for reference
  public getMockNFTs(): NFTData[] {
    return [...mockNFTs];
  }
}

// Export singleton instance
export const hybridNFTService = HybridNFTService.getInstance();
