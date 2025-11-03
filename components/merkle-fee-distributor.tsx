"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ToggleLeft, 
  ToggleRight,
  Wallet,
  Coins,
  BarChart3,
  Users
} from "lucide-react"
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESSES, ABIS } from "@/lib/contracts"
import { formatUnits, parseUnits } from "viem"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WalletInfo {
  address: string
  name: string
  description: string
  isActive: boolean
}

export function MerkleFeeDistributor() {
  const contractAddress = CONTRACT_ADDRESSES.MERKLE_FEE_COLLECTOR
  const contractABI = ABIS.MERKLE_FEE_COLLECTOR

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash })

  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingWallet, setEditingWallet] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    address: "",
    name: "",
    description: ""
  })

  // Load wallet data
  const { data: walletAddresses, refetch: refetchWallets } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getWalletAddresses',
  })

  // Load distribution stats
  const { data: distributionStats, refetch: refetchDistributionStats } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getDistributionStats',
    args: [CONTRACT_ADDRESSES.BTC1USD as `0x${string}`],
  })

  // Load total distribution count
  const { data: totalDistributionCount, refetch: refetchTotalDistributionCount } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getTotalDistributionCount',
  })

  // Load individual wallet info
  useEffect(() => {
    const loadWalletInfo = async () => {
      if (!walletAddresses) return
      
      setLoading(true)
      const walletList: WalletInfo[] = []
      
      for (const address of walletAddresses as string[]) {
        try {
          // In a real implementation, we would call the contract method to get wallet info
          // For now, we'll simulate with mock data
          walletList.push({
            address,
            name: `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
            description: `Description for ${address}`,
            isActive: true
          })
        } catch (error) {
          console.error(`Error loading wallet info for ${address}:`, error)
        }
      }
      
      setWallets(walletList)
      setLoading(false)
    }
    
    loadWalletInfo()
  }, [walletAddresses])

  const handleAddWallet = () => {
    setEditingWallet(null)
    setFormData({
      address: "",
      name: "",
      description: ""
    })
    setShowAddForm(true)
  }

  const handleEditWallet = (wallet: WalletInfo) => {
    setEditingWallet(wallet.address)
    setFormData({
      address: wallet.address,
      name: wallet.name,
      description: wallet.description
    })
    setShowAddForm(true)
  }

  const handleSaveWallet = () => {
    if (!formData.address || !formData.name) {
      alert("Please fill all required fields")
      return
    }

    if (editingWallet) {
      // Update existing wallet
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'updateWallet',
        args: [
          formData.address as `0x${string}`,
          formData.name,
          formData.description
        ]
      })
    } else {
      // Add new wallet
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'addWallet',
        args: [
          formData.address as `0x${string}`,
          formData.name,
          formData.description
        ]
      })
    }
    
    setShowAddForm(false)
  }

  const handleRemoveWallet = (address: string) => {
    if (confirm("Are you sure you want to remove this wallet?")) {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'removeWallet',
        args: [address as `0x${string}`]
      })
    }
  }

  const handleToggleWallet = (address: string, isActive: boolean) => {
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: contractABI,
      functionName: isActive ? 'deactivateWallet' : 'activateWallet',
      args: [address as `0x${string}`]
    })
  }

  // Refresh data after successful transaction
  useEffect(() => {
    if (isSuccess) {
      refetchWallets()
      refetchDistributionStats()
      refetchTotalDistributionCount()
      setFormData({
        address: "",
        name: "",
        description: ""
      })
      setShowAddForm(false)
      setEditingWallet(null)
    }
  }, [isSuccess, refetchWallets, refetchDistributionStats, refetchTotalDistributionCount])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Distributions
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {totalDistributionCount?.toString() || "0"}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Across all tokens
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Distribution Stats
            </CardTitle>
            <Coins className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-white">
              {distributionStats ? distributionStats[0]?.toString() || "0" : "0"} Distributions
            </div>
            <div className="text-lg font-bold text-white">
              {distributionStats ? formatUnits(distributionStats[1] || 0n, 8) : "0"} BTC1USD
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Total distributed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Recipients
            </CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {distributionStats ? distributionStats[2]?.toString() || "0" : "0"}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Total recipients
            </p>
            <div className="text-sm text-gray-400 mt-1">
              {distributionStats ? distributionStats[3]?.toString() || "0" : "0"} Failed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Merkle Fee Distributor Wallets
              </CardTitle>
              <CardDescription>
                Manage wallets that receive Merkle distribution fees
              </CardDescription>
            </div>
            <Button onClick={handleAddWallet} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Wallet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {writeError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Error: {writeError.message}
              </AlertDescription>
            </Alert>
          )}
          
          {receiptError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Transaction error: {receiptError.message}
              </AlertDescription>
            </Alert>
          )}
          
          {isSuccess && (
            <Alert className="mb-4 bg-green-500/20 border-green-500/50">
              <AlertDescription className="text-green-500">
                Transaction successful!
              </AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <p>Loading wallets...</p>
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No wallets configured yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wallets.map((wallet) => (
                <div 
                  key={wallet.address} 
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-800/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${wallet.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      <div>
                        <h3 className="font-medium">{wallet.name}</h3>
                        <p className="text-sm text-gray-400 font-mono">{wallet.address}</p>
                        <p className="text-sm text-gray-500 mt-1">{wallet.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleWallet(wallet.address, wallet.isActive)}
                      disabled={isPending || isConfirming}
                    >
                      {wallet.isActive ? (
                        <ToggleLeft className="h-4 w-4 text-green-500" />
                      ) : (
                        <ToggleRight className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditWallet(wallet)}
                      disabled={isPending || isConfirming}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveWallet(wallet.address)}
                      disabled={isPending || isConfirming}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingWallet ? 'Edit Wallet' : 'Add New Wallet'}
            </CardTitle>
            <CardDescription>
              {editingWallet 
                ? 'Update wallet information' 
                : 'Add a new wallet to the distribution list'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Wallet Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="0x..."
                disabled={!!editingWallet}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Wallet name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Wallet description"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingWallet(null)
                }}
                disabled={isPending || isConfirming}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveWallet}
                disabled={isPending || isConfirming}
              >
                {isPending || isConfirming ? 'Saving...' : 'Save Wallet'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}