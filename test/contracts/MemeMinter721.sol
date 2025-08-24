// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/common/ERC2981.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Counters.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/Pausable.sol";

contract MemeMinter721 is ERC721, ERC721URIStorage, ERC2981, Ownable, Pausable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Events
    event Minted(
        uint256 indexed tokenId,
        address indexed to,
        string tokenURI,
        string indexed trendHash
    );
    
    // Mapping to track minted trends (prevent duplicates within time window)
    mapping(string => uint256) public trendToTokenId;
    mapping(string => uint256) public trendMintedAt;
    
    // Deduplication window (24 hours)
    uint256 public constant DEDUP_WINDOW = 86400;
    
    constructor(
        string memory name,
        string memory symbol,
        address defaultRoyaltyReceiver,
        uint96 defaultRoyaltyFeeNumerator // 250 = 2.5%
    ) ERC721(name, symbol) {
        // Set default royalty
        _setDefaultRoyalty(defaultRoyaltyReceiver, defaultRoyaltyFeeNumerator);
        
        // Start token IDs from 1
        _tokenIdCounter.increment();
    }
    
    /**
     * @dev Mint new meme NFT to specified address
     * @param to Address to mint to
     * @param tokenURI IPFS metadata URI
     * @param trendHash Hash of the trend (for deduplication)
     */
    function mintTo(
        address to,
        string memory tokenURI,
        string memory trendHash
    ) public onlyOwner whenNotPaused returns (uint256) {
        // Check for recent duplicate trends
        if (trendToTokenId[trendHash] != 0 && 
            block.timestamp - trendMintedAt[trendHash] < DEDUP_WINDOW) {
            revert("Trend already minted recently");
        }
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Mint NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Track trend
        trendToTokenId[trendHash] = tokenId;
        trendMintedAt[trendHash] = block.timestamp;
        
        emit Minted(tokenId, to, tokenURI, trendHash);
        
        return tokenId;
    }
    
    /**
     * @dev Get current token ID counter
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev Check if trend was minted recently
     */
    function isTrendRecentlyMinted(string memory trendHash) public view returns (bool) {
        return trendToTokenId[trendHash] != 0 && 
               block.timestamp - trendMintedAt[trendHash] < DEDUP_WINDOW;
    }
    
    /**
     * @dev Update default royalty (owner only)
     */
    function setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) public onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }
    
    /**
     * @dev Set royalty for specific token
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) public onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }
    
    /**
     * @dev Pause contract (emergency)
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Batch mint for efficiency (optional)
     */
    function batchMintTo(
        address to,
        string[] memory tokenURIs,
        string[] memory trendHashes
    ) public onlyOwner whenNotPaused returns (uint256[] memory) {
        require(tokenURIs.length == trendHashes.length, "Array length mismatch");
        
        uint256[] memory tokenIds = new uint256[](tokenURIs.length);
        
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            tokenIds[i] = mintTo(to, tokenURIs[i], trendHashes[i]);
        }
        
        return tokenIds;
    }
    
    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}