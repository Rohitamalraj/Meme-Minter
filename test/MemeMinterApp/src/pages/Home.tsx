import { Link } from "react-router-dom"
import { useUser } from "@/contexts/UserContext"
import Particles from "@/components/Particles"
import { Zap, Rocket, Star, ShoppingCart, Palette, Coins } from "lucide-react"

const sampleNFTs = [
  {
    id: 1,
    image: "/sampleNFTs/SAMPLE_MEME.png",
    title: "Cyber Meme #001",
    creator: "NeuraLink",
    price: "0.5"
  },
  {
    id: 2,
    image: "/sampleNFTs/TEST_2.jpg",
    title: "Digital Punk #042",
    creator: "CyberArtist",
    price: "0.3"
  },
  {
    id: 3,
    image: "/sampleNFTs/6147674617238637775.jpg",
    title: "Neon Dream #123",
    creator: "FutureCreator",
    price: "0.8"
  }
]

export default function Home() {
  const { isConnected, userRole } = useUser()

  return (
    <div className="min-h-screen bg-dark-100 text-white">
      {/* Hero Section with Particles */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Particles Background */}
        <div className="absolute inset-0 z-0">
          <Particles
            particleColors={['#3b82f6', '#8b5cf6', '#10b981']}
            particleCount={300}
            particleSpread={15}
            speed={0.15}
            particleBaseSize={80}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-100/50 via-transparent to-dark-100/80 z-10"></div>
        
        {/* Content */}
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 cursor-target font-mono">
            <span className="text-gradient bg-gradient-to-r from-primary-blue via-primary-purple to-primary-green bg-clip-text text-transparent">
              TURN MEMES
            </span>
            <br />
            <span className="text-white">INTO NFTs</span>
          </h1>
          <p className="font-mono text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Enter the digital marketplace where art meets blockchain technology
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {!isConnected ? (
              <>
                <button className="primary-button cursor-target px-8 py-4 rounded-lg font-mono font-bold tracking-wider">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>CONNECT WALLET</span>
                  </div>
                </button>
                <Link to="/marketplace">
                  <button className="bg-dark-300 border border-primary-purple/30 text-white hover:border-primary-purple hover:text-primary-purple cursor-target px-8 py-4 rounded-lg font-mono font-bold tracking-wider transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="w-5 h-5" />
                      <span>BROWSE MARKETPLACE</span>
                    </div>
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/create">
                  <button className="primary-button cursor-target px-8 py-4 rounded-lg font-mono font-bold tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Palette className="w-5 h-5" />
                      <span>CREATE & MINT</span>
                    </div>
                  </button>
                </Link>
                <Link to="/marketplace">
                  <button className="bg-dark-300 border border-primary-green/30 text-white hover:border-primary-green hover:text-primary-green cursor-target px-8 py-4 rounded-lg font-mono font-bold tracking-wider transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="w-5 h-5" />
                      <span>MARKETPLACE</span>
                    </div>
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-dark-200">
        <div className="container mx-auto">
          <h2 className="font-mono font-bold text-3xl md:text-5xl text-center mb-16 text-primary-blue text-glow tracking-wider">
            HOW IT WORKS
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="dark-card cursor-target p-8 text-center hover:subtle-glow transition-all duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary-blue to-primary-green flex items-center justify-center">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-mono font-bold text-xl mb-4 text-primary-blue">CONNECT</h3>
              <p className="font-mono text-gray-400 leading-relaxed">
                Link your digital wallet to the blockchain network and join the revolution
              </p>
            </div>
            
            <div className="dark-card cursor-target p-8 text-center hover:subtle-glow transition-all duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary-purple to-accent-indigo flex items-center justify-center">
                <Palette className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-mono font-bold text-xl mb-4 text-primary-purple">CREATE</h3>
              <p className="font-mono text-gray-400 leading-relaxed">
                Upload your digital art and transform it into a unique blockchain asset
              </p>
            </div>
            
            <div className="dark-card cursor-target p-8 text-center hover:subtle-glow transition-all duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary-green to-accent-teal flex items-center justify-center">
                <Coins className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-mono font-bold text-xl mb-4 text-primary-green">TRADE</h3>
              <p className="font-mono text-gray-400 leading-relaxed">
                List on the marketplace and watch collectors compete for your digital creations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending NFTs Preview */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="font-mono font-bold text-3xl md:text-5xl text-center mb-16 text-primary-purple text-glow tracking-wider">
            TRENDING ASSETS
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {sampleNFTs.map((nft) => (
              <div key={nft.id} className="dark-card cursor-target rounded-lg overflow-hidden hover:subtle-glow transition-all duration-300 group">
                <div className="relative overflow-hidden">
                  <img 
                    src={nft.image} 
                    alt={nft.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/300x300/1f2937/3b82f6?text=${encodeURIComponent(nft.title)}`
                    }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-white text-glow font-mono">{nft.title}</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 font-mono">Creator</p>
                      <p className="text-primary-blue font-mono">{nft.creator}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400 font-mono">Price</p>
                      <p className="text-2xl font-bold text-primary-green text-glow font-mono">{nft.price} SEI</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Link to="/marketplace">
              <button className="primary-button cursor-target px-8 py-4 rounded-lg font-mono font-bold tracking-wider">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5" />
                  <span>EXPLORE ALL ASSETS</span>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-dark-200">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            {!isConnected ? (
              <>
                <h2 className="font-mono font-bold text-3xl md:text-5xl mb-6 text-white tracking-wider">
                  ENTER THE <span className="text-primary-blue text-glow">FUTURE</span>
                </h2>
                <p className="font-mono text-lg text-gray-400 mb-12 leading-relaxed">
                  Join the digital revolution where creativity meets blockchain technology
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <button className="primary-button cursor-target px-8 py-4 rounded-lg font-mono font-bold tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Rocket className="w-5 h-5" />
                      <span>START CREATING</span>
                    </div>
                  </button>
                  <button className="bg-dark-300 border border-primary-purple/30 text-white hover:border-primary-purple hover:text-primary-purple cursor-target px-8 py-4 rounded-lg font-mono font-bold tracking-wider transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5" />
                      <span>START COLLECTING</span>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-mono font-bold text-3xl md:text-5xl mb-6 text-white tracking-wider">
                  WELCOME TO THE <span className="text-primary-green text-glow">FUTURE</span>
                </h2>
                <p className="font-mono text-lg text-gray-400 mb-12 leading-relaxed">
                  Your wallet is connected. Ready to shape the digital landscape?
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link to="/create">
                    <button className="primary-button cursor-target px-8 py-4 rounded-lg font-mono font-bold tracking-wider">
                      <div className="flex items-center space-x-2">
                        <Palette className="w-5 h-5" />
                        <span>CREATE ART</span>
                      </div>
                    </button>
                  </Link>
                  <Link to="/marketplace">
                    <button className="bg-dark-300 border border-primary-blue/30 text-white hover:border-primary-blue hover:text-primary-blue cursor-target px-8 py-4 rounded-lg font-mono font-bold tracking-wider transition-all duration-300">
                      <div className="flex items-center space-x-2">
                        <ShoppingCart className="w-5 h-5" />
                        <span>EXPLORE MARKET</span>
                      </div>
                    </button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}