import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const pixelButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-pixel text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider border-2",
  {
    variants: {
      variant: {
        default: "bg-background border-white text-white hover:bg-white hover:text-black hover:shadow-neon",
        primary: "bg-white text-black border-white hover:bg-neon-cyan hover:border-neon-cyan hover:text-black hover:shadow-neon",
        accent: "bg-background border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black hover:shadow-neon",
        purple: "bg-background border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-black hover:shadow-neon-purple",
        green: "bg-background border-neon-green text-neon-green hover:bg-neon-green hover:text-black hover:shadow-neon-green",
        destructive: "bg-background border-red-500 text-red-500 hover:bg-red-500 hover:text-black",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-14 px-8 py-4 text-base",
        xl: "h-16 px-10 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface PixelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pixelButtonVariants> {
  asChild?: boolean
}

const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(pixelButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
PixelButton.displayName = "PixelButton"

export { PixelButton, pixelButtonVariants }