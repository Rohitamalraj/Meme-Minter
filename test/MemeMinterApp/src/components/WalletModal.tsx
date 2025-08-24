import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { WalletProvider } from '@/types/wallet'
import { UserRole } from '@/contexts/UserContext'

interface WalletOption {
  name: string
  icon: string
  id: string
  installed?: boolean
  downloadUrl?: string
}

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (walletAddress: string, selectedRole: UserRole) => void
  selectedRole: UserRole
}

interface WalletError extends Error {
  code?: number
}

export function WalletModal({ isOpen, onClose, onConnect, selectedRole }: WalletModalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedWallet, setConnectedWallet] = useState<string>('')
  const { toast } = useToast()

  // SEI Testnet network configuration
  const seiTestnetConfig = {
    chainId: '0x530', // 1328 in hex (actual working chain ID)
    chainName: 'Sei Testnet',
    nativeCurrency: {
      name: 'SEI',
      symbol: 'SEI',
      decimals: 18,
    },
    rpcUrls: ['https://evm-rpc-testnet.sei-apis.com'],
    blockExplorerUrls: ['https://seitrace.com'],
  }

  // Alternative SEI testnet configurations for fallback
  const seiTestnetAlternatives = [
    {
      chainId: '0x530', // 1328 (primary - actual working)
      rpcUrl: 'https://evm-rpc-testnet.sei-apis.com'
    },
    {
      chainId: '0xAE5FB', // 713715 (automation script)
      rpcUrl: 'https://evm-rpc-testnet.sei-apis.com'
    },
    {
      chainId: '0x1F8', // 504 (another alternative)
      rpcUrl: 'https://evm-rpc-testnet.sei-apis.com'
    }
  ]

  // Function to add/switch to SEI testnet
  const addSeiTestnetNetwork = async (provider: WalletProvider) => {
    // Try switching to existing network configurations first
    for (const config of seiTestnetAlternatives) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: config.chainId }],
        })
        console.log(`Successfully switched to SEI testnet with chain ID: ${config.chainId}`)
        return // Successfully switched
      } catch (switchError: unknown) {
        // Continue to next configuration
        continue
      }
    }

    // If switching failed for all configurations, try adding the primary network
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [seiTestnetConfig],
      })
      console.log('Successfully added SEI testnet network')
    } catch (addError: unknown) {
      const error = addError as WalletError
      if (error.code === 4001) {
        throw new Error('User rejected the network addition')
      } else {
        console.error('Failed to add SEI testnet:', error)
        throw new Error(`Failed to add SEI testnet. Please add it manually with Chain ID: 1328`)
      }
    }
  }

  const walletOptions: WalletOption[] = [
    {
      name: 'MetaMask',
      icon: '🦊',
      id: 'metamask',
      installed: typeof window !== 'undefined' && !!window.ethereum?.isMetaMask,
      downloadUrl: 'https://metamask.io/download/'
    },
    {
      name: 'Compass Wallet',
      icon: '🧭',
      id: 'compass',
      installed: typeof window !== 'undefined' && !!window.compass,
      downloadUrl: 'https://chrome.google.com/webstore/detail/compass-wallet-for-sei/anokgmphncpekkhclmingpimjmcooifb'
    },
    {
      name: 'Coinbase Wallet',
      icon: '🔷',
      id: 'coinbase',
      installed: typeof window !== 'undefined' && !!window.ethereum?.isCoinbaseWallet,
      downloadUrl: 'https://www.coinbase.com/wallet'
    },
    {
      name: 'WalletConnect',
      icon: '🔗',
      id: 'walletconnect',
      installed: true, // Always available
    },
    {
      name: 'Trust Wallet',
      icon: '🛡️',
      id: 'trust',
      installed: typeof window !== 'undefined' && !!window.ethereum?.isTrust,
      downloadUrl: 'https://trustwallet.com/'
    }
  ]

  const connectWallet = async (walletId: string) => {
    setIsConnecting(true)
    setConnectedWallet(walletId)

    try {
      let provider: WalletProvider | null = null
      let accounts: string[] = []

      switch (walletId) {
        case 'metamask':
          if (!window.ethereum?.isMetaMask) {
            throw new Error('MetaMask not installed')
          }
          provider = window.ethereum
          try {
            // Add/switch to SEI testnet
            await addSeiTestnetNetwork(provider)
            accounts = await provider.request({ method: 'eth_requestAccounts' })
          } catch (error) {
            console.error('MetaMask connection error:', error);
            if (error instanceof Error && error.message.includes('User rejected')) {
              throw new Error('Connection request was rejected by user');
            }
            throw error;
          }
          break

        case 'compass': {
          if (!window.compass) {
            throw new Error('Compass Wallet not installed')
          }
          try {
            // Try different SEI chain identifiers that Compass might recognize
            const seiChainIds = [
              'atlantic-2',      // SEI testnet chain ID
              'sei-testnet-2',   // Alternative testnet ID
              'sei-chain',       // Generic SEI chain
              'pacific-1'        // SEI mainnet (fallback)
            ];
            
            let connected = false;
            let lastError = null;
            
            for (const chainId of seiChainIds) {
              try {
                console.log(`Attempting to connect to Compass with chain ID: ${chainId}`);
                await window.compass.enable?.(chainId);
                const key = await window.compass.getKey?.(chainId);
                
                if (key?.bech32Address) {
                  console.log(`Successfully connected to Compass with chain ID: ${chainId}`);
                  accounts = [key.bech32Address];
                  connected = true;
                  break;
                }
              } catch (chainError) {
                console.log(`Chain ID ${chainId} failed:`, chainError);
                lastError = chainError;
                continue;
              }
            }
            
            if (!connected) {
              console.error('All chain IDs failed. Last error:', lastError);
              throw new Error('Unable to connect to any SEI network. Please ensure Compass wallet has SEI network configured.');
            }
          } catch (error) {
            console.error('Compass wallet connection error:', error);
            throw error;
          }
          break
        }

        case 'coinbase':
          if (!window.ethereum?.isCoinbaseWallet) {
            throw new Error('Coinbase Wallet not installed')
          }
          provider = window.ethereum
          // Add/switch to SEI testnet
          await addSeiTestnetNetwork(provider)
          accounts = await provider.request({ method: 'eth_requestAccounts' })
          break

        case 'trust':
          if (!window.ethereum?.isTrust) {
            throw new Error('Trust Wallet not installed')
          }
          provider = window.ethereum
          // Add/switch to SEI testnet
          await addSeiTestnetNetwork(provider)
          accounts = await provider.request({ method: 'eth_requestAccounts' })
          break

        case 'walletconnect': {
          try {
            // WalletConnect implementation with SEI testnet
            const { EthereumProvider } = await import('@walletconnect/ethereum-provider')
            const wcProvider = await EthereumProvider.init({
              projectId: 'demo-project-id', // Replace with your actual project ID from WalletConnect
              chains: [713715], // SEI testnet chain ID (matching automation script)
              showQrModal: true,
              rpcMap: {
                713715: 'https://evm-rpc-testnet.sei-apis.com'
              },
              metadata: {
                name: 'Meme Minter',
                description: 'NFT Meme Minting Platform',
                url: 'https://your-domain.com',
                icons: ['https://your-domain.com/icon.png']
              }
            })
            accounts = await wcProvider.enable()
          } catch (error) {
            console.error('WalletConnect error:', error);
            throw new Error('Failed to connect via WalletConnect. Please try again.');
          }
          break
        }

        default:
          throw new Error('Wallet not supported')
      }

      if (accounts && accounts.length > 0) {
        const address = accounts[0]
        // Format address for display purposes only
        const formattedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
        
        // Pass the FULL address to onConnect, not the formatted one
        onConnect(address, selectedRole)
        toast({
          title: "Wallet Connected",
          description: `Successfully connected as ${selectedRole} with ${walletOptions.find(w => w.id === walletId)?.name}`,
        })
        onClose()
      }
    } catch (error: unknown) {
      console.error('Wallet connection error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet'
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
      setConnectedWallet('')
    }
  }

  const handleDownload = (url: string) => {
    window.open(url, '_blank')
  }

  // Sort wallets: installed first, then popular ones
  const sortedWallets = [...walletOptions].sort((a, b) => {
    if (a.installed && !b.installed) return -1
    if (!a.installed && b.installed) return 1
    return 0
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white font-bold text-2xl text-center">
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm text-center">
            Connecting as <span className="text-neon-cyan font-semibold capitalize">{selectedRole}</span> to SEI testnet
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Installed Wallets */}
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
              Installed Wallets
            </h3>
            {sortedWallets
              .filter(wallet => wallet.installed)
              .map((wallet) => (
                <Button
                  key={wallet.id}
                  variant="outline"
                  className="w-full justify-start text-left h-14 bg-black/50 border-white/20 hover:bg-white/10 hover:border-white/40 text-white"
                  onClick={() => connectWallet(wallet.id)}
                  disabled={isConnecting}
                >
                  <span className="text-2xl mr-3">{wallet.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{wallet.name}</div>
                    <div className="text-xs text-white/60">
                      {isConnecting && connectedWallet === wallet.id 
                        ? 'Connecting...' 
                        : 'Detected'
                      }
                    </div>
                  </div>
                  {isConnecting && connectedWallet === wallet.id && (
                    <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                  )}
                </Button>
              ))}
          </div>

          {/* Popular Wallets (Not Installed) */}
          {sortedWallets.some(wallet => !wallet.installed) && (
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                Popular Wallets
              </h3>
              {sortedWallets
                .filter(wallet => !wallet.installed && wallet.downloadUrl)
                .map((wallet) => (
                  <Button
                    key={wallet.id}
                    variant="outline"
                    className="w-full justify-start text-left h-14 bg-black/30 border-white/10 hover:bg-white/5 hover:border-white/20 text-white/70"
                    onClick={() => handleDownload(wallet.downloadUrl!)}
                  >
                    <span className="text-2xl mr-3">{wallet.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{wallet.name}</div>
                      <div className="text-xs text-white/50">Install to connect</div>
                    </div>
                    <div className="text-xs text-white/50">Install</div>
                  </Button>
                ))}
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="text-yellow-400 text-xs text-center">
              🔒 We do not store your private keys. Your wallet remains in your control.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
