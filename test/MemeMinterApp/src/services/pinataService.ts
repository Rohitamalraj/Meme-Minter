// Pinata service for IPFS uploads
export interface PinataConfig {
  apiKey?: string
  secretApiKey?: string
  jwt?: string
}

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string
  }>
  external_url?: string
  background_color?: string
}

export interface UploadResult {
  hash: string
  url: string
}

export class PinataService {
  private config: PinataConfig

  constructor(config: PinataConfig) {
    this.config = config
  }

  private getAuthHeaders(): Record<string, string> {
    if (this.config.jwt) {
      return {
        'Authorization': `Bearer ${this.config.jwt}`
      }
    } else if (this.config.apiKey && this.config.secretApiKey) {
      return {
        'pinata_api_key': this.config.apiKey,
        'pinata_secret_api_key': this.config.secretApiKey
      }
    } else {
      throw new Error('Pinata authentication not configured. Provide either JWT or API key/secret.')
    }
  }

  async uploadImage(file: File): Promise<UploadResult> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const pinataMetadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          type: 'nft-image',
          collection: 'meme-minter',
          uploaded_at: new Date().toISOString()
        }
      })
      formData.append('pinataMetadata', pinataMetadata)

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Pinata upload failed: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      
      return {
        hash: result.IpfsHash,
        url: `ipfs://${result.IpfsHash}`
      }
    } catch (error) {
      console.error('Image upload error:', error)
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async uploadMetadata(metadata: NFTMetadata): Promise<UploadResult> {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(metadata),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Pinata metadata upload failed: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      
      return {
        hash: result.IpfsHash,
        url: `ipfs://${result.IpfsHash}`
      }
    } catch (error) {
      console.error('Metadata upload error:', error)
      throw new Error(`Failed to upload metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  createNFTMetadata(
    name: string,
    description: string,
    imageUrl: string,
    attributes: Array<{ trait_type: string; value: string }> = []
  ): NFTMetadata {
    return {
      name,
      description,
      image: imageUrl,
      attributes: [
        ...attributes,
        {
          trait_type: "Source",
          value: "Meme Minter App"
        },
        {
          trait_type: "Generation Date",
          value: new Date().toISOString().split('T')[0]
        }
      ],
      external_url: "https://meme-minter.app",
      background_color: "000000"
    }
  }

  generateTrendHash(name: string, description: string): string {
    // Create a trend hash matching automation script pattern
    const TREND_HASH_PREFIX = "viral-meme-"
    const template = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    return `${TREND_HASH_PREFIX}${Date.now()}-${template}`
  }
}

// Initialize Pinata service with environment variables
export const pinataService = new PinataService({
  apiKey: import.meta.env.VITE_PINATA_API_KEY || '',
  secretApiKey: import.meta.env.VITE_PINATA_SECRET_KEY || '',
  jwt: import.meta.env.VITE_PINATA_JWT || ''
})
