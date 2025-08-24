import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ViralCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glass?: boolean;
  gradient?: boolean;
}

export const ViralCard: React.FC<ViralCardProps> = ({
  children,
  className,
  hover = true,
  glow = false,
  glass = false,
  gradient = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { y: -8, scale: 1.02 } : undefined}
      className={cn(
        // Base styles
        'relative rounded-3xl border transition-all duration-300',
        // Glass morphism
        glass && 'glass-card',
        // Regular card
        !glass && 'bg-card border-border',
        // Gradient background
        gradient && 'bg-gradient-viral',
        // Glow effect
        glow && 'shadow-glow hover:shadow-glow-lg',
        // Hover effects
        hover && 'hover:shadow-lg hover:border-viral-purple/30',
        className
      )}
    >
      {/* Gradient overlay for enhanced visual depth */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};
