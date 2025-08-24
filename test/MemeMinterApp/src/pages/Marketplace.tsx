import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { hybridNFTService } from '@/services/hybridNFTService';
import { NFTData } from '@/services/localDbService';
import { Search, ShoppingCart, User, Calendar, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Particles from '@/components/Particles';
import ChromaGrid, { ChromaItem } from '@/components/ChromaGrid';

const Marketplace: React.FC = () => {
  const { walletAddress, isConnected } = useUser();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [myNfts, setMyNfts] = useState<NFTData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('marketplace');

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      try {
        const listedNFTs = hybridNFTService.getListedNFTs();
        setNfts(listedNFTs);
        
        if (isConnected && walletAddress) {
          const userNFTs = hybridNFTService.getNFTsByOwner(walletAddress);
          setMyNfts(userNFTs);
        }
      } catch (error) {
        console.error('Error loading NFTs:', error);
        toast.error('Failed to load NFTs');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isConnected, walletAddress]);

  const handlePurchase = async (nftId: string) => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setPurchasing(nftId);
    try {
      const success = hybridNFTService.purchaseNFT(nftId, walletAddress);
      if (success) {
        toast.success('NFT purchased successfully!');
        // Reload data
        const listedNFTs = hybridNFTService.getListedNFTs();
        setNfts(listedNFTs);
        const userNFTs = hybridNFTService.getNFTsByOwner(walletAddress);
        setMyNfts(userNFTs);
      } else {
        toast.error('Failed to purchase NFT');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  const filteredNFTs = nfts.filter(nft =>
    nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nft.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Convert NFT data to ChromaGrid format
  const convertNFTsToChromaItems = (nftList: NFTData[]): ChromaItem[] => {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
    
    return nftList.map((nft, index) => ({
      image: nft.image,
      title: nft.name,
      subtitle: `${nft.price} SEI`,
      handle: `${nft.creator.slice(0, 6)}...${nft.creator.slice(-4)}`,
      location: new Date(nft.createdAt).toLocaleDateString(),
      borderColor: colors[index % colors.length],
      gradient: `linear-gradient(145deg, ${colors[index % colors.length]}, #000)`,
      url: `#nft-${nft.id}` // We'll handle purchase through custom click handler
    }));
  };

  // Handle NFT card click for purchase
  const handleNFTCardClick = (item: ChromaItem, index: number) => {
    if (activeTab === 'marketplace') {
      const nft = filteredNFTs[index];
      if (nft) {
        handlePurchase(nft.id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 text-white">
      {/* Header Section */}
      <div className="relative overflow-hidden h-[600px]">
        {/* Particles Background */}
        <div className="absolute inset-0 z-0">
          <Particles
            particleColors={['#3b82f6', '#8b5cf6', '#10b981']}
            particleCount={200}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-primary-blue/10 via-primary-purple/10 to-primary-green/10 z-10"></div>
        <div className="relative z-20 container mx-auto px-6 py-16 h-full flex items-center">
          <div className="text-center space-y-6 w-full">
            <h1 className="text-6xl font-bold text-white text-glow font-mono tracking-wider">
              MARKETPLACE
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-mono">
              Discover, collect, and trade digital assets in the future
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-blue w-5 h-5" />
              <input
                type="text"
                placeholder="Search NFTs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-300/80 backdrop-blur-md border border-primary-blue/30 rounded-lg pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-primary-blue focus:outline-none subtle-glow font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-40 bg-dark-100/95 backdrop-blur-lg border-b border-primary-blue/30">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`py-4 px-6 font-mono font-bold tracking-wider transition-all cursor-target ${
                activeTab === 'marketplace'
                  ? 'text-primary-blue border-b-2 border-primary-blue subtle-glow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              MARKETPLACE
            </button>
            {isConnected && (
              <button
                onClick={() => setActiveTab('collection')}
                className={`py-4 px-6 font-mono font-bold tracking-wider transition-all cursor-target ${
                  activeTab === 'collection'
                    ? 'text-primary-purple border-b-2 border-primary-purple subtle-glow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                MY COLLECTION
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 pb-32">
        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xl text-gray-400 font-mono">LOADING NETWORK...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'marketplace' ? (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white text-glow font-mono">
                    DIGITAL ASSETS ({filteredNFTs.length})
                  </h2>
                </div>
                
                {filteredNFTs.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-2xl text-gray-400 font-mono">NO ASSETS FOUND</p>
                    <p className="text-gray-500 mt-2 font-mono">Try adjusting your search parameters</p>
                  </div>
                ) : (
                  <div className="min-h-[600px] pb-20" style={{ position: 'relative' }}>
                    <ChromaGrid 
                      items={convertNFTsToChromaItems(filteredNFTs)}
                      radius={300}
                      damping={0.45}
                      fadeOut={0.6}
                      ease="power3.out"
                      onItemClick={handleNFTCardClick}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white text-glow font-mono">
                    MY COLLECTION ({myNfts.length})
                  </h2>
                </div>
                
                {myNfts.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-2xl text-gray-400 font-mono">NO ASSETS OWNED</p>
                    <p className="text-gray-500 mt-2 font-mono">Start building your digital collection</p>
                  </div>
                ) : (
                  <div className="min-h-[600px] pb-20" style={{ position: 'relative' }}>
                    <ChromaGrid 
                      items={convertNFTsToChromaItems(myNfts)}
                      radius={300}
                      damping={0.45}
                      fadeOut={0.6}
                      ease="power3.out"
                      onItemClick={() => {}} // No action for owned NFTs
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
