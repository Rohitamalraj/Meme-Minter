// Utility functions for handling IPFS and image URLs
export const imageUtils = {
  // Convert IPFS hash or URL to a proper gateway URL
  getImageUrl: (imageUrl: string): string => {
    if (!imageUrl) return '';
    
    // If it's already a full HTTP URL, return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // If it's an IPFS hash (starts with Qm or baf)
    if (imageUrl.startsWith('Qm') || imageUrl.startsWith('baf')) {
      return `https://gateway.pinata.cloud/ipfs/${imageUrl}`;
    }
    
    // If it's an ipfs:// protocol URL
    if (imageUrl.startsWith('ipfs://')) {
      const hash = imageUrl.replace('ipfs://', '');
      return `https://gateway.pinata.cloud/ipfs/${hash}`;
    }
    
    // If it contains 'ipfs/' in the path
    if (imageUrl.includes('ipfs/')) {
      return imageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    
    // Return original URL as fallback
    return imageUrl;
  },

  // Get multiple fallback URLs for an image
  getFallbackUrls: (imageUrl: string): string[] => {
    const baseUrl = imageUtils.getImageUrl(imageUrl);
    const hash = imageUtils.extractIPFSHash(imageUrl);
    
    if (!hash) return [baseUrl];
    
    return [
      `https://gateway.pinata.cloud/ipfs/${hash}`,
      `https://ipfs.io/ipfs/${hash}`,
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
      `https://dweb.link/ipfs/${hash}`,
      baseUrl
    ];
  },

  // Extract IPFS hash from various URL formats
  extractIPFSHash: (url: string): string | null => {
    if (!url) return null;
    
    // Direct hash
    if (url.match(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[0-9a-z]{56})$/)) {
      return url;
    }
    
    // Extract from various IPFS URL formats
    const patterns = [
      /\/ipfs\/([Qm][1-9A-HJ-NP-Za-km-z]{44}|baf[0-9a-z]{56})/,
      /ipfs:\/\/([Qm][1-9A-HJ-NP-Za-km-z]{44}|baf[0-9a-z]{56})/,
      /([Qm][1-9A-HJ-NP-Za-km-z]{44}|baf[0-9a-z]{56})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  },

  // Create a placeholder URL with text
  getPlaceholder: (text: string, width = 300, height = 300): string => {
    const encodedText = encodeURIComponent(text);
    return `https://via.placeholder.com/${width}x${height}/333333/ffffff?text=${encodedText}`;
  },

  // Validate if URL is likely to be an image
  isImageUrl: (url: string): boolean => {
    if (!url) return false;
    
    // Check for image extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
    if (imageExtensions.test(url)) return true;
    
    // Check for IPFS URLs (assume they're images in our context)
    if (url.includes('ipfs')) return true;
    
    // Check for known image hosting domains
    const imageHosts = ['images.unsplash.com', 'picsum.photos', 'via.placeholder.com'];
    return imageHosts.some(host => url.includes(host));
  }
};

export default imageUtils;
