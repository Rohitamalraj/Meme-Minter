import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ViralBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  glow?: boolean;
  className?: string;
}

const variants = {
  default: 'bg-secondary text-secondary-foreground border-border',
  success: 'bg-viral-green/20 text-viral-green border-viral-green/30',
  warning: 'bg-viral-amber/20 text-viral-amber border-viral-amber/30',
  error: 'bg-viral-red/20 text-viral-red border-viral-red/30',
  info: 'bg-viral-blue/20 text-viral-blue border-viral-blue/30',
  gradient: 'bg-gradient-viral text-white border-transparent',
};

const sizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const ViralBadge: React.FC<ViralBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  pulse = false,
  glow = false,
  className,
}) => {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center font-medium rounded-full border backdrop-blur-sm',
        // Variants
        variants[variant],
        // Sizes
        sizes[size],
        // Pulse animation
        pulse && 'animate-pulse',
        // Glow effect
        glow && 'shadow-glow',
        className
      )}
    >
      {children}
    </motion.span>
  );
};
