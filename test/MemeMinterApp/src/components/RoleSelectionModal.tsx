import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { UserRole } from '@/contexts/UserContext'

interface RoleSelectionModalProps {
  isOpen: boolean
  onRoleSelect: (role: UserRole) => void
  onClose: () => void
}

export function RoleSelectionModal({ isOpen, onRoleSelect, onClose }: RoleSelectionModalProps) {
  const handleRoleSelect = (role: UserRole) => {
    onRoleSelect(role)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white font-bold text-2xl text-center">
            Choose Your Role
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm text-center">
            Select how you want to use the platform
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-6">
          {/* Creator/Artist Option */}
          <Button
            variant="outline"
            className="w-full h-20 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 hover:border-purple-400 hover:bg-purple-600/30 text-white flex flex-col items-center justify-center space-y-2"
            onClick={() => handleRoleSelect('creator')}
          >
            <div className="text-3xl">🎨</div>
            <div>
              <div className="font-bold text-lg">Creator / Artist</div>
              <div className="text-sm text-white/70">Create, mint, and list NFTs</div>
            </div>
          </Button>

          {/* Buyer Option */}
          <Button
            variant="outline"
            className="w-full h-20 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-600/30 text-white flex flex-col items-center justify-center space-y-2"
            onClick={() => handleRoleSelect('buyer')}
          >
            <div className="text-3xl">🛒</div>
            <div>
              <div className="font-bold text-lg">Buyer / Collector</div>
              <div className="text-sm text-white/70">Browse and purchase NFTs</div>
            </div>
          </Button>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="text-yellow-400 text-xs text-center space-y-1">
              <div className="font-semibold">💡 Role Features:</div>
              <div><strong>Creators:</strong> Can create, mint, list NFTs & view marketplace</div>
              <div><strong>Buyers:</strong> Can browse, purchase NFTs & manage collection</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
