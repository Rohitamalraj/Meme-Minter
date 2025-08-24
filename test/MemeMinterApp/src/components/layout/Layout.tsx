import React from 'react';
import { Header } from "./Header";
import { Footer } from "./Footer";
import TargetCursor from "../TargetCursor";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-dark-100 relative overflow-hidden">
      {/* Target Cursor */}
      <TargetCursor 
        spinDuration={2}
        hideDefaultCursor={true}
        targetSelector=".cursor-target"
      />

      {/* Grid background */}
      <div 
        className="fixed inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Animated lines */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-blue to-transparent animate-slide-glow"></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-purple to-transparent animate-slide-glow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-primary-green to-transparent animate-slide-glow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute right-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-accent-indigo to-transparent animate-slide-glow" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Subtle glow orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary-blue opacity-5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-primary-purple opacity-5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary-green opacity-3 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        <Header />
        
        <main className="min-h-screen">
          {children}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}