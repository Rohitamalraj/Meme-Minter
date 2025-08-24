// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/IERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/IERC721Receiver.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/Pausable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Counters.sol";
contract MemeSale is IERC721Receiver, ReentrancyGuard, Pausable, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _listingIdCounter;
    
    struct Listing {
        address nft;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
        uint256 listedAt;
    }
    
    // Platform fee configuration
    address public feeRecipient;
    uint256 public feeBps; // Basis points (250 = 2.5%)
    uint256 public constant MAX_FEE_BPS = 1000; // Max 10% fee
    
    // Mappings
    mapping(uint256 => Listing) public listings;
    mapping(address => mapping(uint256 => uint256)) public tokenToListingId; // nft => tokenId => listingId
    
    // Events
    event Listed(
        uint256 indexed listingId,
        address indexed nft,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );
    
    event Purchased(
        uint256 indexed listingId,
        address indexed nft,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price,
        uint256 fee
    );
    
    event Cancelled(
        uint256 indexed listingId,
        address indexed nft,
        uint256 indexed tokenId,
        address seller
    );
    
    event PriceUpdated(
        uint256 indexed listingId,
        uint256 oldPrice,
        uint256 newPrice
    );
    
    constructor(address _feeRecipient, uint256 _feeBps) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_feeBps <= MAX_FEE_BPS, "Fee too high");
        
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
        
        // Start listing IDs from 1
        _listingIdCounter.increment();
    }
    
    /**
     * @dev List NFT for sale
     * @param nft NFT contract address
     * @param tokenId Token ID to list
     * @param price Price in wei
     */
    function list(
        address nft,
        uint256 tokenId,
        uint256 price
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(price > 0, "Price must be greater than 0");
        require(IERC721(nft).ownerOf(tokenId) == msg.sender, "Not owner");
        require(IERC721(nft).isApprovedForAll(msg.sender, address(this)) || 
                IERC721(nft).getApproved(tokenId) == address(this), "Not approved");
        require(tokenToListingId[nft][tokenId] == 0, "Already listed");
        
        uint256 listingId = _listingIdCounter.current();
        _listingIdCounter.increment();
        
        // Transfer NFT to this contract for escrow
        IERC721(nft).safeTransferFrom(msg.sender, address(this), tokenId);
        
        // Create listing
        listings[listingId] = Listing({
            nft: nft,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            listedAt: block.timestamp
        });
        
        tokenToListingId[nft][tokenId] = listingId;
        
        emit Listed(listingId, nft, tokenId, msg.sender, price);
        
        return listingId;
    }
    
    /**
     * @dev Buy listed NFT
     * @param listingId ID of the listing
     */
    function buy(uint256 listingId) external payable whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing not active");
        require(msg.value == listing.price, "Incorrect payment amount");
        require(msg.sender != listing.seller, "Cannot buy own listing");
        
        // Calculate fees
        uint256 fee = (listing.price * feeBps) / 10000;
        uint256 sellerAmount = listing.price - fee;
        
        // Mark as inactive
        listing.active = false;
        tokenToListingId[listing.nft][listing.tokenId] = 0;
        
        // Transfer NFT to buyer
        IERC721(listing.nft).safeTransferFrom(address(this), msg.sender, listing.tokenId);
        
        // Transfer payments
        if (fee > 0) {
            payable(feeRecipient).transfer(fee);
        }
        payable(listing.seller).transfer(sellerAmount);
        
        emit Purchased(
            listingId,
            listing.nft,
            listing.tokenId,
            listing.seller,
            msg.sender,
            listing.price,
            fee
        );
    }
    
    /**
     * @dev Cancel listing
     * @param listingId ID of the listing
     */
    function cancel(uint256 listingId) external whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not seller");
        
        // Mark as inactive
        listing.active = false;
        tokenToListingId[listing.nft][listing.tokenId] = 0;
        
        // Return NFT to seller
        IERC721(listing.nft).safeTransferFrom(address(this), msg.sender, listing.tokenId);
        
        emit Cancelled(listingId, listing.nft, listing.tokenId, msg.sender);
    }
    
    /**
     * @dev Update listing price
     * @param listingId ID of the listing
     * @param newPrice New price in wei
     */
    function updatePrice(uint256 listingId, uint256 newPrice) external whenNotPaused {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not seller");
        require(newPrice > 0, "Price must be greater than 0");
        
        uint256 oldPrice = listing.price;
        listing.price = newPrice;
        
        emit PriceUpdated(listingId, oldPrice, newPrice);
    }
    
    /**
     * @dev Get listing details
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    /**
     * @dev Get active listings (for pagination)
     */
    function getActiveListings(uint256 offset, uint256 limit) 
        external view returns (uint256[] memory activeIds) {
        
        uint256 totalListings = _listingIdCounter.current() - 1;
        uint256 count = 0;
        
        // First pass: count active listings
        for (uint256 i = 1; i <= totalListings && count < limit; i++) {
            if (listings[i].active && count >= offset) {
                count++;
            }
        }
        
        activeIds = new uint256[](count);
        uint256 index = 0;
        count = 0;
        
        // Second pass: collect IDs
        for (uint256 i = 1; i <= totalListings && index < activeIds.length; i++) {
            if (listings[i].active) {
                if (count >= offset) {
                    activeIds[index] = i;
                    index++;
                }
                count++;
            }
        }
        
        return activeIds;
    }
    
    /**
     * @dev Get current listing counter
     */
    function getCurrentListingId() external view returns (uint256) {
        return _listingIdCounter.current();
    }
    
    /**
     * @dev Update fee configuration (owner only)
     */
    function updateFeeConfig(address _feeRecipient, uint256 _feeBps) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_feeBps <= MAX_FEE_BPS, "Fee too high");
        
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal (only if paused)
     */
    function emergencyWithdraw(address nft, uint256 tokenId, address to) external onlyOwner {
        require(paused(), "Contract not paused");
        IERC721(nft).safeTransferFrom(address(this), to, tokenId);
    }
    
    /**
     * @dev Required for receiving NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
    
    /**
     * @dev Prevent accidental ETH deposits
     */
    receive() external payable {
        revert("Direct deposits not allowed");
    }
}