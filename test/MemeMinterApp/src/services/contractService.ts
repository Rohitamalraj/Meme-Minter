import { ethers } from 'ethers'

// Contract addresses - update these with your deployed addresses
export const CONTRACT_ADDRESSES = {
  MEME_MINTER: import.meta.env.VITE_MEME_MINTER_CONTRACT || '0x742d35Cc6d906f8e1e8F32E09Cee36EdB1234567', // Replace with actual
  MEME_SALE: import.meta.env.VITE_MEME_SALE_CONTRACT || '0x789d35Cc6d906f8e1e8F32E09Cee36EdB1234567' // Replace with actual
}

// SEI Testnet configuration
export const SEI_TESTNET_CONFIG = {
  chainId: '0x530', // 1328 in hex (matching actual wallet connection)
  chainName: 'Sei Testnet',
  nativeCurrency: {
    name: 'SEI',
    symbol: 'SEI',
    decimals: 18,
  },
  rpcUrls: ['https://evm-rpc-testnet.sei-apis.com'],
  blockExplorerUrls: ['https://seitrace.com'],
}

// Contract ABIs - Updated to match working automation script
export const MEME_MINTER_ABI = [
  "function mintTo(address to, string memory tokenURI, string memory trendHash) public returns (uint256)",
  "function getCurrentTokenId() public view returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function setApprovalForAll(address operator, bool approved) public",
  "function isApprovedForAll(address owner, address operator) public view returns (bool)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "event Minted(uint256 indexed tokenId, address indexed to, string tokenURI, string trendHash)"
]

export const MEME_SALE_ABI = [
  "function list(address nft, uint256 tokenId, uint256 price) public returns (uint256)",
  "function buy(uint256 listingId) public payable",
  "function cancel(uint256 listingId) public",
  "function updatePrice(uint256 listingId, uint256 newPrice) public",
  "function getCurrentListingId() public view returns (uint256)",
  "function getListing(uint256 listingId) public view returns (tuple(address nft, uint256 tokenId, address seller, uint256 price, bool active, uint256 listedAt))",
  "function getActiveListings(uint256 offset, uint256 limit) public view returns (uint256[] memory)",
  "function paused() public view returns (bool)",
  "event Listed(uint256 indexed listingId, address indexed nft, uint256 indexed tokenId, address seller, uint256 price)",
  "event Purchased(uint256 indexed listingId, address indexed nft, uint256 indexed tokenId, address seller, address buyer, uint256 price, uint256 fee)"
]

export interface MemeNFT {
  tokenId: number
  name: string
  description: string
  imageUrl: string
  metadataUrl: string
  owner: string
  trendHash: string
}

export interface NFTListing {
  listingId: number
  nft: string
  tokenId: number
  seller: string
  price: string
  active: boolean
  listedAt: number
}

export class ContractService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null
  private signerAddress: string | null = null
  private minterContract: ethers.Contract | null = null
  private saleContract: ethers.Contract | null = null

  private validateAddress(address: string): string {
    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid address format: ${address}`)
    }
    return ethers.getAddress(address) // Normalize the address
  }

  async initialize() {
    if (!window.ethereum) {
      throw new Error('MetaMask not found')
    }

    this.provider = new ethers.BrowserProvider(window.ethereum)
    
    // Configure the network properly to avoid ENS issues
    const network = await this.provider.getNetwork()
    console.log('Connected to network:', network.name, 'Chain ID:', network.chainId.toString())
    
    this.signer = await this.provider.getSigner()
    
    // Cache the signer address to avoid ENS resolution later
    this.signerAddress = await this.signer.getAddress()
    console.log('Signer address:', this.signerAddress)
    
    // Initialize contracts
    this.minterContract = new ethers.Contract(
      CONTRACT_ADDRESSES.MEME_MINTER,
      MEME_MINTER_ABI,
      this.signer
    )
    
    this.saleContract = new ethers.Contract(
      CONTRACT_ADDRESSES.MEME_SALE,
      MEME_SALE_ABI,
      this.signer
    )
  }

  async mintNFT(
    to: string,
    tokenURI: string,
    trendHash: string
  ): Promise<{ tokenId: number; transactionHash: string }> {
    if (!this.minterContract) {
      throw new Error('Contracts not initialized')
    }

    try {
      // Validate and normalize the address to prevent ENS lookup
      const validAddress = this.validateAddress(to)
      console.log('Minting NFT to address:', validAddress)
      console.log('Token URI:', tokenURI)
      console.log('Trend Hash:', trendHash)
      
      // Mint NFT with increased gas limit (matching automation script)
      const tx = await this.minterContract.mintTo(validAddress, tokenURI, trendHash, {
        gasLimit: 500000
      })
      
      console.log('Mint transaction hash:', tx.hash)
      console.log('Waiting for confirmation...')
      const receipt = await tx.wait()
      
      if (receipt.status !== 1) {
        throw new Error(`Minting transaction failed with status: ${receipt.status}`)
      }
      
      // Parse the Minted event to get token ID (matching automation script logic)
      let tokenId = null
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.minterContract.interface.parseLog(log)
          if (parsedLog && parsedLog.name === 'Minted') {
            tokenId = parsedLog.args.tokenId.toString()
            console.log('Found Minted event: Token ID', tokenId)
            break
          }
        } catch (error) {
          // Skip unparseable logs
          continue
        }
      }
      
      // Fallback: If we couldn't parse the event, get the current token ID - 1
      if (!tokenId) {
        try {
          const currentTokenId = await this.minterContract.getCurrentTokenId()
          tokenId = (Number(currentTokenId) - 1).toString()
          console.log('Using fallback method: Token ID', tokenId, '(current-1)')
        } catch (e) {
          console.error('Could not determine token ID:', e)
          throw new Error('Failed to determine minted token ID')
        }
      }
      
      console.log(`NFT minted successfully! Token ID: ${tokenId}, Gas used: ${receipt.gasUsed}`)
      
      return {
        tokenId: Number(tokenId),
        transactionHash: receipt.hash
      }
    } catch (error) {
      console.error('Minting error:', error)
      throw new Error(`Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listNFT(
    tokenId: number,
    priceInEth: string
  ): Promise<{ listingId: number; transactionHash: string }> {
    if (!this.minterContract || !this.saleContract || !this.signerAddress) {
      throw new Error('Contracts not initialized')
    }

    try {
      console.log(`Listing NFT Token ID ${tokenId} on marketplace...`)
      
      // Step 1: Check if MemeSale contract is approved for all NFTs (matching automation script)
      console.log('Checking approval for all NFTs...')
      const isApprovedForAll = await this.minterContract.isApprovedForAll(
        this.signerAddress,
        CONTRACT_ADDRESSES.MEME_SALE
      )
      
      if (!isApprovedForAll) {
        console.log('Setting approval for all NFTs to MemeSale contract...')
        const approvalTx = await this.minterContract.setApprovalForAll(
          CONTRACT_ADDRESSES.MEME_SALE,
          true,
          {
            gasLimit: 100000
          }
        )
        await approvalTx.wait()
        console.log('Approval for all confirmed:', approvalTx.hash)
      } else {
        console.log('Already approved for all NFTs')
      }
      
      // Step 2: Verify token ownership before listing
      try {
        const tokenOwner = await this.minterContract.ownerOf(tokenId)
        if (tokenOwner.toLowerCase() !== this.signerAddress.toLowerCase()) {
          throw new Error(`Token ${tokenId} is not owned by the connected wallet`)
        }
        console.log(`Token ${tokenId} ownership confirmed`)
      } catch (error) {
        throw new Error(`Token ${tokenId} does not exist or ownership check failed`)
      }
      
      // Step 3: Convert price to wei
      const priceInWei = ethers.parseEther(priceInEth)
      console.log(`Listing price: ${priceInEth} SEI (${priceInWei.toString()} wei)`)
      
      // Step 4: List the NFT on MemeSale marketplace (matching automation script exactly)
      console.log(`Calling MemeSale.list(${CONTRACT_ADDRESSES.MEME_MINTER}, ${tokenId}, ${priceInWei.toString()})...`)
      const listTx = await this.saleContract.list(
        CONTRACT_ADDRESSES.MEME_MINTER,
        tokenId,
        priceInWei,
        {
          gasLimit: 300000
        }
      )
      
      console.log('Listing transaction:', listTx.hash)
      const listReceipt = await listTx.wait()
      
      if (listReceipt.status !== 1) {
        throw new Error(`Listing transaction failed with status: ${listReceipt.status}`)
      }
      
      // Step 5: Parse the Listed event to get listing ID (matching automation script)
      let listingId = null
      for (const log of listReceipt.logs) {
        try {
          const parsedLog = this.saleContract.interface.parseLog(log)
          if (parsedLog && parsedLog.name === 'Listed') {
            listingId = parsedLog.args.listingId.toString()
            console.log('Found Listed event: Listing ID', listingId)
            break
          }
        } catch (error) {
          // Skip unparseable logs
          continue
        }
      }
      
      // Fallback: If we couldn't parse the event, try to get current listing ID
      if (!listingId) {
        try {
          const currentListingId = await this.saleContract.getCurrentListingId()
          listingId = (Number(currentListingId) - 1).toString() // Previous listing ID
          console.log('Using fallback method: Listing ID', listingId, '(current-1)')
        } catch (e) {
          console.error('Could not determine listing ID:', e)
          throw new Error('Failed to determine listing ID')
        }
      }
      
      console.log(`NFT listed successfully! Listing ID: ${listingId}, Price: ${priceInEth} SEI`)
      
      return {
        listingId: Number(listingId),
        transactionHash: listReceipt.hash
      }
    } catch (error) {
      console.error('Listing error:', error)
      throw new Error(`Failed to list NFT: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async verifyTokenOwnership(tokenId: number, expectedOwner: string): Promise<boolean> {
    if (!this.minterContract) {
      throw new Error('Contracts not initialized')
    }

    try {
      const tokenOwner = await this.minterContract.ownerOf(tokenId)
      const normalizedExpected = this.validateAddress(expectedOwner)
      const normalizedOwner = this.validateAddress(tokenOwner)
      
      if (normalizedOwner.toLowerCase() !== normalizedExpected.toLowerCase()) {
        throw new Error(`Token ${tokenId} is owned by ${tokenOwner}, not ${expectedOwner}`)
      }
      
      return true
    } catch (error) {
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getActiveListings(offset: number = 0, limit: number = 20): Promise<NFTListing[]> {
    if (!this.saleContract) {
      throw new Error('Contracts not initialized')
    }

    try {
      const listingIds = await this.saleContract.getActiveListings(offset, limit)
      const listings: NFTListing[] = []
      
      for (const listingId of listingIds) {
        const listing = await this.saleContract.getListing(Number(listingId))
        listings.push({
          listingId: Number(listingId),
          nft: listing.nft,
          tokenId: Number(listing.tokenId),
          seller: listing.seller,
          price: ethers.formatEther(listing.price),
          active: listing.active,
          listedAt: Number(listing.listedAt)
        })
      }
      
      return listings
    } catch (error) {
      console.error('Error getting listings:', error)
      return []
    }
  }

  async getNFTMetadata(tokenId: number): Promise<unknown> {
    if (!this.minterContract) {
      throw new Error('Contracts not initialized')
    }

    try {
      const tokenURI = await this.minterContract.tokenURI(tokenId)
      
      // Handle IPFS URLs
      let metadataUrl = tokenURI
      if (tokenURI.startsWith('ipfs://')) {
        metadataUrl = `https://gateway.pinata.cloud/ipfs/${tokenURI.replace('ipfs://', '')}`
      }
      
      const response = await fetch(metadataUrl)
      const metadata = await response.json()
      
      return metadata
    } catch (error) {
      console.error('Error getting NFT metadata:', error)
      return null
    }
  }
}

export const contractService = new ContractService()
