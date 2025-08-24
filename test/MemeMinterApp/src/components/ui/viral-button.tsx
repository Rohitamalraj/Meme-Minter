import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ViralButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'gradient' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  shimmer?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary: 'bg-viral-purple hover:bg-viral-purple/80 text-white border-viral-purple/20',
  secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border',
  accent: 'bg-viral-cyan hover:bg-viral-cyan/80 text-black border-viral-cyan/20',
  gradient: 'bg-gradient-viral hover:opacity-90 text-white border-transparent',
  ghost: 'bg-transparent hover:bg-white/5 text-foreground border-border hover:border-viral-purple/50',
  destructive: 'bg-viral-red hover:bg-viral-red/80 text-white border-viral-red/20',
};

const sizes = {
  sm: 'px-4 py-2 text-sm h-9',
  md: 'px-6 py-3 text-base h-11',
  lg: 'px-8 py-4 text-lg h-14',
  xl: 'px-10 py-5 text-xl h-16',
};

export const ViralButton: React.FC<ViralButtonProps> = ({
  variant = 'primary',
  size = 'md',
  glow = false,
  shimmer = false,
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center font-medium rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-viral-purple/50 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none',
        // Variants
        variants[variant],
        // Sizes
        sizes[size],
        // Glow effect
        glow && 'shadow-glow hover:shadow-glow-lg',
        // Shimmer effect
        shimmer && 'overflow-hidden',
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {/* Shimmer overlay */}
      {shimmer && (
        <div className="absolute inset-0 -top-px overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full animate-shimmer" />
        </div>
      )}
      
      {/* Button content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
      
      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.button>
  );
};
