import { ScrambleText } from './ScrambleText'

export function Header() {
  return (
    <header className="relative z-10 p-6 bg-dark-100/95 backdrop-blur-lg border-b border-neon-cyan/30 neon-border">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-neon-cyan neon-glow rounded"></div>
          <ScrambleText className="text-3xl md:text-4xl font-bold text-neon-cyan neon-text font-mono" />
        </div>
        
        <div className="flex gap-8">
          <a 
            href="#home" 
            className="text-white/80 hover:text-neon-cyan transition-all font-medium text-lg neon-button px-4 py-2 rounded tracking-wider font-mono"
          >
            HOME
          </a>
          <a 
            href="#marketplace" 
            className="text-white/80 hover:text-neon-pink transition-all font-medium text-lg neon-button px-4 py-2 rounded tracking-wider font-mono"
          >
            MARKETPLACE
          </a>
          <a 
            href="#create" 
            className="text-white/80 hover:text-neon-green transition-all font-medium text-lg neon-button px-4 py-2 rounded tracking-wider font-mono"
          >
            CREATE
          </a>
          <a 
            href="#about" 
            className="text-white/80 hover:text-neon-purple transition-all font-medium text-lg neon-button px-4 py-2 rounded tracking-wider font-mono"
          >
            ABOUT
          </a>
        </div>
      </nav>
    </header>
  )
}
