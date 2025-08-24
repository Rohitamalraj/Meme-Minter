import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { WalletModal } from "@/components/WalletModal"
import { RoleSelectionModal } from "@/components/RoleSelectionModal"
import { useUser, UserRole } from "@/contexts/UserContext"
import PillNav from "@/components/PillNav"

export function Header() {
  const location = useLocation()
  const { userRole, walletAddress, isConnected, setWalletConnection, disconnectWallet } = useUser()
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)

  const handleConnectWallet = () => {
    setIsRoleModalOpen(true)
  }

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setIsRoleModalOpen(false)
    setIsWalletModalOpen(true)
  }

  const handleWalletConnected = (address: string, role: UserRole) => {
    setWalletConnection(address, role)
    setIsWalletModalOpen(false)
  }

  const handleDisconnectWallet = () => {
    disconnectWallet()
  }

  const getNavigationItems = () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Marketplace', href: '/marketplace' }
    ];

    if (isConnected && userRole === 'creator') {
      items.push({ label: 'Create', href: '/create' });
    }

    if (isConnected) {
      items.push({ 
        label: userRole === 'creator' ? 'My NFTs' : 'Collection', 
        href: '/profile' 
      });
    }

    return items;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-sm border-b border-primary-blue/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo and App Name */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-blue to-primary-purple rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <h1 className="font-mono font-bold text-2xl text-primary-blue text-glow">
              MEME MINTER
            </h1>
          </Link>

          {/* PillNav - Centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <PillNav
              logo="/logo.svg"
              logoAlt="Meme Mint Logo"
              items={getNavigationItems()}
              activeHref={location.pathname}
              className=""
              ease="power2.easeOut"
              baseColor="#1e293b"
              pillColor="#ffffff"
              hoveredPillTextColor="#ffffff"
              pillTextColor="#1e293b"
              initialLoadAnimation={false}
            />
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm text-primary-green uppercase">
                  {userRole}
                </span>
                <Button
                  onClick={handleDisconnectWallet}
                  variant="outline"
                  size="sm"
                  className="font-mono border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white primary-border cursor-target"
                >
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConnectWallet}
                className="font-mono bg-gradient-to-r from-primary-blue to-primary-purple text-white font-bold subtle-glow hover:animate-glow cursor-target"
              >
                CONNECT WALLET
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-20"></div>

      <RoleSelectionModal 
        isOpen={isRoleModalOpen}
        onRoleSelect={handleRoleSelect}
        onClose={() => setIsRoleModalOpen(false)}
      />

      <WalletModal 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleWalletConnected}
        selectedRole={selectedRole}
      />
    </>
  )
}