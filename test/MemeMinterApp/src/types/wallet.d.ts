// Global window extensions for wallet providers
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      isCoinbaseWallet?: boolean
      isTrust?: boolean
      isRainbow?: boolean
      isBraveWallet?: boolean
      request: (args: { method: string; params?: unknown[] }) => Promise<string[]>
    }
    phantom?: {
      ethereum?: {
        request: (args: { method: string; params?: unknown[] }) => Promise<string[]>
      }
    }
    okexchain?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<string[]>
    }
    compass?: {
      getOfflineSigner?: (chainId: string) => {
        signAmino?: (signerAddress: string, signDoc: unknown) => Promise<unknown>
        signDirect?: (signerAddress: string, signDoc: unknown) => Promise<unknown>
      }
      enable?: (chainId: string) => Promise<void>
      getKey?: (chainId: string) => Promise<{ bech32Address: string; name: string }>
    }
    keplr?: {
      enable?: (chainId: string) => Promise<void>
      getKey?: (chainId: string) => Promise<{ bech32Address: string; name: string }>
    }
  }
}

export interface WalletProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<string[]>
}

export {}
