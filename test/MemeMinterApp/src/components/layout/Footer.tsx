import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="border-t-2 border-white bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-cyber font-bold text-xl text-neon-cyan mb-4">PIXEL MEME MINT</h3>
            <p className="font-pixel text-muted-foreground mb-4">
              Turn your memes into NFTs with retro style. Create, mint, and trade in the ultimate pixel marketplace.
            </p>
          </div>
          
          <div>
            <h4 className="font-pixel text-white mb-4 uppercase tracking-wider">LINKS</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="font-pixel text-muted-foreground hover:text-neon-cyan transition-colors">
                  ABOUT
                </Link>
              </li>
              <li>
                <Link to="/contact" className="font-pixel text-muted-foreground hover:text-neon-cyan transition-colors">
                  CONTACT
                </Link>
              </li>
              <li>
                <a href="#" className="font-pixel text-muted-foreground hover:text-neon-cyan transition-colors">
                  TELEGRAM BOT
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-pixel text-white mb-4 uppercase tracking-wider">COMMUNITY</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="font-pixel text-muted-foreground hover:text-neon-purple transition-colors">
                  DISCORD
                </a>
              </li>
              <li>
                <a href="#" className="font-pixel text-muted-foreground hover:text-neon-purple transition-colors">
                  TWITTER
                </a>
              </li>
              <li>
                <a href="#" className="font-pixel text-muted-foreground hover:text-neon-purple transition-colors">
                  REDDIT
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t-2 border-white mt-8 pt-6 text-center">
          <p className="font-pixel text-muted-foreground">
            © 2025 PIXEL MEME MINT. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  )
}