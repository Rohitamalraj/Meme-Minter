import { useState } from "react"
import { NFTCard } from "@/components/ui/nft-card"
import { PixelButton } from "@/components/ui/pixel-button"
import Particles from '@/components/Particles'
import nftSample1 from "@/assets/nft-sample-1.jpg"
import nftSample2 from "@/assets/nft-sample-2.jpg"
import nftSample3 from "@/assets/nft-sample-3.jpg"

// Mock user data
const mockUserNFTs = [
  {
    id: 1,
    image: nftSample1,
    title: "My Cool Cat #001",
    creator: "You",
    price: "0.5",
    status: "owned"
  },
  {
    id: 2,
    image: nftSample2,
    title: "Cyber Dog #042", 
    creator: "You",
    price: "0.3",
    status: "minted"
  },
  {
    id: 3,
    image: nftSample3,
    title: "Space Pepe #123",
    creator: "CryptoPixel",
    price: "0.8",
    status: "owned"
  }
]

export default function Profile() {
  const [activeTab, setActiveTab] = useState("owned")
  const walletAddress = "0x742d35Cc6639C9532C3fd5e5F8e1f8e1"

  const filteredNFTs = mockUserNFTs.filter(nft => {
    if (activeTab === "owned") return nft.status === "owned"
    if (activeTab === "minted") return nft.status === "minted" || nft.creator === "You"
    return true
  })

  return (
    <div className="min-h-screen bg-dark-100 relative overflow-hidden">
      {/* Particles Background */}
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={['#3b82f6', '#8b5cf6', '#10b981']}
          particleCount={180}
          particleSpread={11}
          speed={0.11}
          particleBaseSize={75}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>
      
      <div className="relative z-10 py-8 pb-32">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="dark-card mb-8 p-8 subtle-glow">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary-blue/20 border-2 border-primary-blue mx-auto mb-4 flex items-center justify-center rounded-full">
                <span className="text-4xl">👤</span>
              </div>
              <h1 className="font-mono font-bold text-3xl md:text-4xl mb-2 text-primary-blue text-glow">
                DIGITAL COLLECTOR
              </h1>
              <p className="font-mono text-gray-400 mb-4">
                {walletAddress}
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="text-center">
                  <div className="font-mono font-bold text-2xl text-primary-green text-glow">
                    {mockUserNFTs.filter(n => n.status === "owned").length}
                  </div>
                  <div className="font-mono text-xs text-gray-500">OWNED</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-2xl text-primary-purple text-glow">
                    {mockUserNFTs.filter(n => n.creator === "You").length}
                  </div>
                  <div className="font-mono text-xs text-gray-500">MINTED</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-2xl text-primary-blue text-glow">2.1</div>
                  <div className="font-mono text-xs text-gray-500">SEI TOTAL</div>
                </div>
              </div>
            </div>
          </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            <button
              className={`px-6 py-2 rounded font-mono font-bold tracking-wider cursor-target transition-all duration-300 ${
                activeTab === "owned" 
                  ? "primary-button" 
                  : "bg-dark-300 border border-gray-600 text-gray-300 hover:border-primary-blue hover:text-primary-blue"
              }`}
              onClick={() => setActiveTab("owned")}
            >
              OWNED NFTS
            </button>
            <button
              className={`px-6 py-2 rounded font-mono font-bold tracking-wider cursor-target transition-all duration-300 ${
                activeTab === "minted" 
                  ? "bg-primary-purple border-2 border-primary-purple text-white" 
                  : "bg-dark-300 border border-gray-600 text-gray-300 hover:border-primary-purple hover:text-primary-purple"
              }`}
              onClick={() => setActiveTab("minted")}
            >
              MINTED NFTS
            </button>
            <button
              className={`px-6 py-2 rounded font-mono font-bold tracking-wider cursor-target transition-all duration-300 ${
                activeTab === "activity" 
                  ? "bg-primary-green border-2 border-primary-green text-white" 
                  : "bg-dark-300 border border-gray-600 text-gray-300 hover:border-primary-green hover:text-primary-green"
              }`}
              onClick={() => setActiveTab("activity")}
            >
              ACTIVITY
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "activity" ? (
          <div className="pixel-container">
            <h2 className="font-cyber font-bold text-2xl mb-6 text-neon-green text-center">
              RECENT ACTIVITY
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/20 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neon-green/20 border border-neon-green flex items-center justify-center">
                    <span className="text-neon-green">✓</span>
                  </div>
                  <div>
                    <p className="font-pixel text-white">Purchased Space Pepe #123</p>
                    <p className="font-pixel text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <span className="font-pixel text-neon-cyan">0.8 SEI</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/20 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neon-purple/20 border border-neon-purple flex items-center justify-center">
                    <span className="text-neon-purple">🎨</span>
                  </div>
                  <div>
                    <p className="font-pixel text-white">Minted Cyber Dog #042</p>
                    <p className="font-pixel text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                <span className="font-pixel text-neon-purple">MINTED</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neon-cyan/20 border border-neon-cyan flex items-center justify-center">
                    <span className="text-neon-cyan">💰</span>
                  </div>
                  <div>
                    <p className="font-pixel text-white">Purchased Cool Cat #001</p>
                    <p className="font-pixel text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
                <span className="font-pixel text-neon-cyan">0.5 SEI</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNFTs.map((nft) => (
              <NFTCard
                key={nft.id}
                image={nft.image}
                title={nft.title}
                creator={nft.creator}
                price={nft.price}
              />
            ))}
          </div>
        )}

        {filteredNFTs.length === 0 && activeTab !== "activity" && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-muted-foreground">🎨</div>
            <h3 className="font-cyber font-bold text-2xl mb-4 text-muted-foreground">
              NO NFTS YET
            </h3>
            <p className="font-pixel text-muted-foreground mb-6">
              {activeTab === "owned" ? "Start collecting some pixel art!" : "Create your first masterpiece!"}
            </p>
            <PixelButton variant="accent">
              {activeTab === "owned" ? "EXPLORE MARKETPLACE" : "CREATE NFT"}
            </PixelButton>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}