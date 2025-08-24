import { PixelButton } from "./pixel-button"

interface NFTCardProps {
  image: string
  title: string
  creator: string
  price: string
  onBuy?: () => void
  className?: string
}

export function NFTCard({ image, title, creator, price, onBuy, className }: NFTCardProps) {
  return (
    <div className={`nft-card ${className || ""}`}>
      <div className="aspect-square mb-4 overflow-hidden border-2 border-white">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
      </div>
      <div className="space-y-2">
        <h3 className="font-cyber font-bold text-white text-lg truncate">{title}</h3>
        <p className="text-muted-foreground text-sm">by {creator}</p>
        <div className="flex items-center justify-between">
          <span className="text-neon-cyan font-pixel text-lg">{price} ETH</span>
          {onBuy && (
            <PixelButton variant="accent" size="sm" onClick={onBuy}>
              BUY
            </PixelButton>
          )}
        </div>
      </div>
    </div>
  )
}