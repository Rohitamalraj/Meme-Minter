// Development utility to manage NFTs in hybrid system
import { hybridNFTService } from './hybridNFTService';

// Function to add some additional sample NFTs (beyond mock data)
export const addSampleNFTs = () => {
  const sampleNFTs = [
    {
      tokenId: "201",
      name: "Diamond Hands Ape",
      description: "An ape with diamond hands that never sells. HODL forever! This legendary creature represents the ultimate crypto conviction.",
      image: "https://images.unsplash.com/photo-1526927071144-8aafd8cf9e4e?w=300&h=300&fit=crop&crop=center",
      ipfsHash: "QmDiamondApe201",
      creator: "0x4444444444444444444444444444444444444444",
      owner: "0x4444444444444444444444444444444444444444",
      price: "1.5",
      isListed: true,
      contractAddress: import.meta.env.VITE_MEME_MINTER_ADDRESS,
      transactionHash: "0xsample201",
      listedAt: new Date().toISOString(),
      attributes: [
        { trait_type: "Hands", value: "Diamond" },
        { trait_type: "Type", value: "Ape Meme" },
        { trait_type: "Strength", value: "HODL Power" }
      ]
    },
    {
      tokenId: "202",
      name: "Rocket Moon Cat",
      description: "A cat that's literally going to the moon! Complete with rocket boosters and space helmet.",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop&crop=center",
      ipfsHash: "QmRocketCat202",
      creator: "0x5555555555555555555555555555555555555555",
      owner: "0x5555555555555555555555555555555555555555",
      price: "0.69",
      isListed: true,
      contractAddress: import.meta.env.VITE_MEME_MINTER_ADDRESS,
      transactionHash: "0xsample202",
      listedAt: new Date().toISOString(),
      attributes: [
        { trait_type: "Vehicle", value: "Rocket" },
        { trait_type: "Type", value: "Space Cat" },
        { trait_type: "Destination", value: "Moon" }
      ]
    }
  ];

  // Add each sample NFT to the hybrid database
  sampleNFTs.forEach(nft => {
    hybridNFTService.saveNFT(nft);
  });

  console.log(`Added ${sampleNFTs.length} additional NFTs to complement the ${hybridNFTService.getMockNFTs().length} mock NFTs`);
  return sampleNFTs.length;
};

// Function to get current marketplace stats for debugging
export const getMarketplaceStats = () => {
  return hybridNFTService.getMarketplaceStats();
};

// Function to clear only real NFTs (preserving mock data)
export const clearRealNFTs = () => {
  hybridNFTService.clearRealNFTs();
  console.log('Cleared real NFTs, mock data preserved');
};

// Function to list all NFTs (mock + real)
export const listAllNFTs = () => {
  const stats = hybridNFTService.getMarketplaceStats();
  const allNFTs = hybridNFTService.getAllNFTs();
  
  console.log('=== NFT Marketplace Overview ===');
  console.log(`Total NFTs: ${stats.totalNFTs} (${stats.mockNFTs} mock + ${stats.realNFTs} real)`);
  console.log(`Listed NFTs: ${stats.listedNFTs}`);
  console.log(`Real Creators: ${stats.totalCreators}`);
  console.log(`Average Price: ${stats.averagePrice.toFixed(3)} SEI`);
  console.log('\n=== All NFTs ===');
  
  allNFTs.forEach((nft, index) => {
    const type = nft.id.startsWith('mock_') ? '[MOCK]' : '[REAL]';
    const status = nft.isListed ? `Listed at ${nft.price} SEI` : 'Not listed';
    console.log(`${index + 1}. ${type} ${nft.name} - ${status}`);
  });
  
  return allNFTs;
};

// Export functions for easy access from browser console
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).addSampleNFTs = addSampleNFTs;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).getMarketplaceStats = getMarketplaceStats;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).clearRealNFTs = clearRealNFTs;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).listAllNFTs = listAllNFTs;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).hybridNFTService = hybridNFTService;
}
