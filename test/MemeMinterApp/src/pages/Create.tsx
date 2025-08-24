import { useState, useRef } from 'react'
import { useUser } from '@/contexts/UserContext'
import { PixelButton } from '@/components/ui/pixel-button'
import ComicButton from '@/components/ComicButton'
import { useToast } from '@/hooks/use-toast'
import { contractService } from '@/services/contractService'
import { pinataService } from '@/services/pinataService'
import { hybridNFTService } from '@/services/hybridNFTService'
import { imageUtils } from '@/utils/imageUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import Particles from '@/components/Particles'

interface MintProgress {
  step: string
  progress: number
  status: 'pending' | 'loading' | 'success' | 'error'
}

export default function Create() {
  const { isConnected, userRole, walletAddress } = useUser()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: import.meta.env.VITE_DEFAULT_NFT_PRICE || '0.01'
  })
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [autoList, setAutoList] = useState(true)
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null)
  
  // Progress tracking
  const [mintProgress, setMintProgress] = useState<MintProgress[]>([
    { step: 'Upload Image to IPFS', progress: 0, status: 'pending' },
    { step: 'Create NFT Metadata', progress: 0, status: 'pending' },
    { step: 'Mint NFT on Blockchain', progress: 0, status: 'pending' },
    { step: 'List on Marketplace', progress: 0, status: 'pending' }
  ])

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive"
      })
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const updateProgress = (stepIndex: number, progress: number, status: MintProgress['status']) => {
    setMintProgress(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, progress, status } : step
    ))
  }

  const resetProgress = () => {
    setMintProgress(prev => prev.map(step => ({
      ...step,
      progress: 0,
      status: 'pending' as const
    })))
  }

  const handleMintNFT = async () => {
    if (!isConnected || userRole !== 'creator') {
      toast({
        title: "Access Denied",
        description: "Only connected creators can mint NFTs",
        variant: "destructive"
      })
      return
    }

    if (!selectedFile || !formData.name || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and select an image",
        variant: "destructive"
      })
      return
    }

    if (!walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    resetProgress()

    try {
      // Initialize contracts
      await contractService.initialize()

      // Step 1: Upload image to IPFS
      updateProgress(0, 25, 'loading')
      toast({
        title: "Uploading Image",
        description: "Uploading your image to IPFS..."
      })

      const imageResult = await pinataService.uploadImage(selectedFile)
      updateProgress(0, 100, 'success')

      // Step 2: Create and upload metadata
      updateProgress(1, 25, 'loading')
      toast({
        title: "Creating Metadata",
        description: "Generating NFT metadata..."
      })

      const metadata = pinataService.createNFTMetadata(
        formData.name,
        formData.description,
        imageResult.url,
        [
          { trait_type: "Meme Template", value: selectedFile.name.replace(/\.[^/.]+$/, "") },
          { trait_type: "Source", value: "PixelMeme Platform" },
          { trait_type: "Generation Date", value: new Date().toISOString().split('T')[0] },
          { trait_type: "File Type", value: selectedFile.type },
          { trait_type: "File Size", value: `${(selectedFile.size / 1024).toFixed(2)} KB` },
          { trait_type: "Creator", value: walletAddress }
        ]
      )

      const metadataResult = await pinataService.uploadMetadata(metadata)
      updateProgress(1, 100, 'success')

      // Step 3: Mint NFT
      updateProgress(2, 25, 'loading')
      toast({
        title: "Minting NFT",
        description: "Minting your NFT on the SEI blockchain..."
      })

      const trendHash = pinataService.generateTrendHash(formData.name, formData.description)
      
      // Debug: Log the wallet address to ensure it's not truncated
      console.log('Minting to wallet address:', walletAddress)
      console.log('Address length:', walletAddress.length)
      console.log('Is valid address format:', walletAddress.startsWith('0x') && walletAddress.length === 42)
      
      const mintResult = await contractService.mintNFT(
        walletAddress,
        metadataResult.url,
        trendHash
      )

      // Store the minted token ID
      setMintedTokenId(mintResult.tokenId.toString())

      updateProgress(2, 100, 'success')

      // Step 4: List on marketplace (if enabled)
      if (autoList && formData.price && parseFloat(formData.price) > 0) {
        updateProgress(3, 25, 'loading')
        
        // Wait for blockchain to finalize the mint (matching automation script)
        toast({
          title: "Preparing Listing",
          description: "Waiting for blockchain to finalize mint..."
        })
        
        console.log('Waiting 10 seconds for blockchain to finalize mint...')
        await new Promise(resolve => setTimeout(resolve, 10000))
        
        // Verify the token exists before listing with retry logic (matching automation script)
        let tokenExists = false
        let retryCount = 0
        const maxRetries = 3
        
        while (!tokenExists && retryCount < maxRetries) {
          try {
            // Try to verify token ownership through contract service
            await contractService.verifyTokenOwnership(mintResult.tokenId, walletAddress)
            console.log(`Token ${mintResult.tokenId} ownership confirmed`)
            tokenExists = true
          } catch (error) {
            retryCount++
            if (retryCount < maxRetries) {
              console.log(`Token ${mintResult.tokenId} not ready yet, retrying in 8 seconds... (${retryCount}/${maxRetries})`)
              toast({
                title: "Waiting for Token",
                description: `Token not ready yet, retrying... (${retryCount}/${maxRetries})`
              })
              await new Promise(resolve => setTimeout(resolve, 8000))
            } else {
              throw new Error(`Token ${mintResult.tokenId} doesn't exist after ${maxRetries} attempts`)
            }
          }
        }
        
        toast({
          title: "Listing NFT",
          description: "Listing your NFT on the marketplace..."
        })

        const listResult = await contractService.listNFT(
          mintResult.tokenId,
          formData.price
        )

        updateProgress(3, 100, 'success')

        // Save to local database
        const savedNFT = hybridNFTService.saveNFT({
          tokenId: mintResult.tokenId.toString(),
          name: formData.name,
          description: formData.description,
          image: imageResult.url,
          ipfsHash: metadataResult.hash,
          creator: walletAddress,
          owner: walletAddress,
          price: formData.price,
          isListed: true,
          contractAddress: import.meta.env.VITE_MEME_MINTER_ADDRESS,
          transactionHash: mintResult.transactionHash,
          listedAt: new Date().toISOString(),
          attributes: [
            { trait_type: "Meme Template", value: selectedFile.name.replace(/\.[^/.]+$/, "") },
            { trait_type: "Source", value: "PixelMeme Platform" },
            { trait_type: "Generation Date", value: new Date().toISOString().split('T')[0] },
            { trait_type: "File Type", value: selectedFile.type },
            { trait_type: "File Size", value: `${(selectedFile.size / 1024).toFixed(2)} KB` },
            { trait_type: "Creator", value: walletAddress }
          ]
        })

        console.log('NFT saved to local database:', savedNFT)

        toast({
          title: "NFT Created & Listed Successfully! 🎉",
          description: `Token ID: ${mintResult.tokenId}, Listing ID: ${listResult.listingId}, Price: ${formData.price} SEI`,
        })
      } else {
        updateProgress(3, 100, 'success')
        
        // Save to local database (not listed)
        const savedNFT = hybridNFTService.saveNFT({
          tokenId: mintResult.tokenId.toString(),
          name: formData.name,
          description: formData.description,
          image: imageResult.url,
          ipfsHash: metadataResult.hash,
          creator: walletAddress,
          owner: walletAddress,
          isListed: false,
          contractAddress: import.meta.env.VITE_MEME_MINTER_ADDRESS,
          transactionHash: mintResult.transactionHash,
          attributes: [
            { trait_type: "Meme Template", value: selectedFile.name.replace(/\.[^/.]+$/, "") },
            { trait_type: "Source", value: "PixelMeme Platform" },
            { trait_type: "Generation Date", value: new Date().toISOString().split('T')[0] },
            { trait_type: "File Type", value: selectedFile.type },
            { trait_type: "File Size", value: `${(selectedFile.size / 1024).toFixed(2)} KB` },
            { trait_type: "Creator", value: walletAddress }
          ]
        })

        console.log('NFT saved to local database (not listed):', savedNFT)
        
        toast({
          title: "NFT Minted Successfully! 🎉",
          description: `Token ID: ${mintResult.tokenId}. You can list it later.`,
        })
      }

      // Reset form
      setSelectedFile(null)
      setImagePreview('')
      setFormData({ name: '', description: '', price: '0.01' })
      setMintedTokenId(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Minting error:', error)
      
      // Update failed step
      const failedStepIndex = mintProgress.findIndex(step => step.status === 'loading')
      if (failedStepIndex !== -1) {
        updateProgress(failedStepIndex, 0, 'error')
      }

      toast({
        title: "Minting Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark-100 relative overflow-hidden">
        {/* Particles Background */}
        <div className="absolute inset-0 z-0">
          <Particles
            particleColors={['#3b82f6', '#8b5cf6', '#10b981']}
            particleCount={150}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={80}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md bg-dark-300/80 backdrop-blur-md border-primary-blue/30">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-4 font-mono">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6 font-mono">
                You need to connect your wallet to create NFTs
              </p>
              <button className="primary-button w-full px-4 py-2 rounded font-mono font-bold tracking-wider cursor-target">
                Connect Wallet
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (userRole !== 'creator') {
    return (
      <div className="min-h-screen bg-dark-100 relative overflow-hidden">
        {/* Particles Background */}
        <div className="absolute inset-0 z-0">
          <Particles
            particleColors={['#3b82f6', '#8b5cf6', '#10b981']}
            particleCount={150}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={80}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md bg-dark-300/80 backdrop-blur-md border-primary-blue/30">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-4 font-mono">Creator Access Only</h2>
              <p className="text-gray-400 mb-6 font-mono">
                Only creators can access the NFT minting page. You're currently connected as a buyer.
              </p>
              <button className="primary-button w-full px-4 py-2 rounded font-mono font-bold tracking-wider cursor-target">
                Go to Marketplace
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-100 relative overflow-hidden">
      {/* Particles Background */}
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={['#3b82f6', '#8b5cf6', '#10b981']}
          particleCount={200}
          particleSpread={12}
          speed={0.12}
          particleBaseSize={70}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>
      
      <div className="relative z-10 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="font-mono font-bold text-4xl md:text-5xl text-primary-blue text-glow mb-4">
              CREATE & MINT NFT
            </h1>
            <p className="font-mono text-lg text-gray-400">
              Transform your memes into valuable digital assets on SEI blockchain
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Form */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card className="bg-black border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-cyber">Upload Your Meme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-neon-cyan transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-64 mx-auto rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setSelectedFile(null)
                          setImagePreview('')
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="text-white/60">
                      <div className="text-4xl mb-4">🎨</div>
                      <p className="mb-2">Click to upload your meme</p>
                      <p className="text-sm">Supports JPG, PNG, GIF (Max 10MB)</p>
                    </div>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                <PixelButton
                  variant="accent"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={isProcessing}
                >
                  {imagePreview ? 'Change Image' : 'Select Image'}
                </PixelButton>
              </CardContent>
            </Card>

            {/* NFT Details Form */}
            <Card className="bg-black border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-cyber">NFT Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white font-pixel">
                    NFT Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="My Awesome Meme NFT"
                    className="bg-black border-white/30 text-white"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-white font-pixel">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Describe your meme NFT, its story, and what makes it special..."
                    className="bg-black border-white/30 text-white min-h-[100px]"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="text-white font-pixel">
                    Listing Price (SEI)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleFormChange('price', e.target.value)}
                    placeholder="0.01"
                    className="bg-black border-white/30 text-white"
                    disabled={isProcessing}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="autoList"
                    type="checkbox"
                    checked={autoList}
                    onChange={(e) => setAutoList(e.target.checked)}
                    className="rounded"
                    disabled={isProcessing}
                  />
                  <Label htmlFor="autoList" className="text-white/80 font-pixel text-sm">
                    Auto-list on marketplace after minting
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Progress & Action */}
          <div className="space-y-6">
            {/* Minting Progress */}
            <Card className="bg-black border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-cyber">Minting Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mintProgress.map((step, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 font-pixel text-sm">
                        {step.step}
                      </span>
                      <span className="text-xs">
                        {step.status === 'pending' && '⏳'}
                        {step.status === 'loading' && '🔄'}
                        {step.status === 'success' && '✅'}
                        {step.status === 'error' && '❌'}
                      </span>
                    </div>
                    <Progress
                      value={step.progress}
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Action Button */}
            <Card className="bg-black border-white/20">
              <CardContent className="pt-6">
                <ComicButton
                  onClick={handleMintNFT}
                  disabled={isProcessing || !selectedFile || !formData.name || !formData.description}
                  className="w-full"
                >
                  {isProcessing ? 'MINTING IN PROGRESS...' : 'MINT NFT 🚀'}
                </ComicButton>
                
                {autoList && (
                  <p className="text-center text-white/60 text-sm mt-3 font-pixel">
                    Will be listed for {formData.price} SEI
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Minted Token ID Display */}
            {mintedTokenId && (
              <Card className="bg-gradient-to-r from-primary-blue/20 to-primary-green/20 border-primary-blue/50 animate-pulse">
                <CardContent className="pt-6 text-center">
                  <h3 className="text-white font-bold text-xl mb-2 font-mono">🎉 NFT Minted Successfully!</h3>
                  <div className="bg-black/50 rounded-lg p-4 border border-primary-blue/30">
                    <p className="text-primary-blue font-mono text-sm mb-2">Token ID:</p>
                    <p className="text-white font-bold text-2xl font-mono break-all">
                      #{mintedTokenId}
                    </p>
                  </div>
                  <p className="text-white/80 text-sm mt-3 mb-4 font-mono">
                    Your NFT has been minted on the SEI blockchain
                  </p>
                  <ComicButton
                    onClick={() => {
                      setMintedTokenId(null)
                      resetProgress()
                    }}
                    className="max-w-xs mx-auto"
                  >
                    Mint Another NFT
                  </ComicButton>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
              <CardContent className="pt-6">
                <h3 className="text-white font-bold mb-2">💡 Pro Tips:</h3>
                <ul className="text-white/80 text-sm space-y-1 font-pixel">
                  <li>• Use high-quality images for better sales</li>
                  <li>• Write engaging descriptions</li>
                  <li>• Price competitively for quick sales</li>
                  <li>• Your NFT will be stored on IPFS forever</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}