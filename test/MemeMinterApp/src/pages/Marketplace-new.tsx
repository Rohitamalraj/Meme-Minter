import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { hybridNFTService } from '@/services/hybridNFTService';
import { NFTData } from '@/services/localDbService';
import { Search, ShoppingCart, User, Calendar, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

  const NFTCard = ({ nft }: { nft: NFTData }) => (
    <div className="dark-card rounded-lg p-4 hover:neon-glow transition-all duration-300 group">
      <div className="relative overflow-hidden rounded-lg mb-4">
        <img 
          src={nft.image} 
          alt={nft.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="bg-neon-cyan text-dark-100 px-2 py-1 rounded text-xs font-mono neon-glow">
            COLLECTIBLE
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-white neon-text font-mono">{nft.name}</h3>
        <p className="text-gray-400 text-sm line-clamp-2 font-mono">{nft.description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 font-mono">
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>{nft.creator.slice(0, 6)}...{nft.creator.slice(-4)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(nft.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-neon-cyan" />
            <span className="text-2xl font-bold text-neon-cyan neon-text font-mono">{nft.price} SEI</span>
          </div>
          
          <button
            onClick={() => handlePurchase(nft.id)}
            disabled={purchasing === nft.id || !isConnected}
            className="neon-button px-6 py-2 rounded-lg font-mono font-bold tracking-wider disabled:opacity-50"
          >
            {purchasing === nft.id ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>BUYING...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>BUY</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-100 text-white">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 via-neon-pink/10 to-neon-green/10"></div>
        <div className="relative z-10 container mx-auto px-6 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-bold text-white neon-text font-mono tracking-wider">
              NEON MARKETPLACE
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-mono">
              Discover, collect, and trade digital assets in the cyberpunk future
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neon-cyan w-5 h-5" />
              <input
                type="text"
                placeholder="Search NFTs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-300 border border-neon-cyan/30 rounded-lg pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none neon-glow font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-40 bg-dark-100/95 backdrop-blur-lg border-b border-neon-cyan/30">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`py-4 px-6 font-mono font-bold tracking-wider transition-all ${
                activeTab === 'marketplace'
                  ? 'text-neon-cyan border-b-2 border-neon-cyan neon-glow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              MARKETPLACE
            </button>
            {isConnected && (
              <button
                onClick={() => setActiveTab('collection')}
                className={`py-4 px-6 font-mono font-bold tracking-wider transition-all ${
                  activeTab === 'collection'
                    ? 'text-neon-pink border-b-2 border-neon-pink neon-glow'
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
      <div className="container mx-auto px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xl text-gray-400 font-mono">LOADING NEURAL NETWORK...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'marketplace' ? (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white neon-text font-mono">
                    DIGITAL ASSETS ({filteredNFTs.length})
                  </h2>
                </div>
                
                {filteredNFTs.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-2xl text-gray-400 font-mono">NO ASSETS FOUND</p>
                    <p className="text-gray-500 mt-2 font-mono">Try adjusting your search parameters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredNFTs.map((nft) => (
                      <NFTCard key={nft.id} nft={nft} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white neon-text font-mono">
                    MY COLLECTION ({myNfts.length})
                  </h2>
                </div>
                
                {myNfts.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-2xl text-gray-400 font-mono">NO ASSETS OWNED</p>
                    <p className="text-gray-500 mt-2 font-mono">Start building your digital collection</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {myNfts.map((nft) => (
                      <div key={nft.id} className="dark-card rounded-lg p-4 neon-glow">
                        <div className="relative overflow-hidden rounded-lg mb-4">
                          <img 
                            src={nft.image} 
                            alt={nft.name}
                            className="w-full h-64 object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <span className="bg-neon-green text-dark-100 px-2 py-1 rounded text-xs font-mono neon-glow">
                              OWNED
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h3 className="text-xl font-bold text-white neon-text font-mono">{nft.name}</h3>
                          <p className="text-gray-400 text-sm line-clamp-2 font-mono">{nft.description}</p>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500 font-mono">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{nft.creator.slice(0, 6)}...{nft.creator.slice(-4)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(nft.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
