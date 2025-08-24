import React, { createContext, useContext, useState, ReactNode } from 'react'

export type UserRole = 'buyer' | 'creator' | null

interface UserContextType {
  userRole: UserRole
  walletAddress: string
  isConnected: boolean
  setUserRole: (role: UserRole) => void
  setWalletConnection: (address: string, role: UserRole) => void
  disconnectWallet: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [walletAddress, setWalletAddress] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  const setWalletConnection = (address: string, role: UserRole) => {
    setWalletAddress(address)
    setUserRole(role)
    setIsConnected(true)
  }

  const disconnectWallet = () => {
    setWalletAddress('')
    setUserRole(null)
    setIsConnected(false)
  }

  return (
    <UserContext.Provider
      value={{
        userRole,
        walletAddress,
        isConnected,
        setUserRole,
        setWalletConnection,
        disconnectWallet,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
