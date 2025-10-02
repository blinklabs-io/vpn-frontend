import { useState, useEffect, useMemo } from "react"
import { useWalletStore } from "../stores/walletStore"
import { useRefData, useSignup, useClientList, useClientProfile, useClientPolling } from "../api/hooks"
import VpnInstance from "../components/VpnInstance"
import WalletModal from "../components/WalletModal"
import { showSuccess, showError } from "../utils/toast"
import type { ClientInfo } from '../api/types'
import LoadingOverlay from "../components/LoadingOverlay"
import TooltipGuide, { type TooltipStep } from "../components/TooltipGuide"

const Account = () => {
  const { 
    isConnected, 
    disconnect, 
    closeWalletModal, 
    isWalletModalOpen,
    balance, 
    walletAddress,
    signAndSubmitTransaction,
  } = useWalletStore()
  const [selectedDuration, setSelectedDuration] = useState<number>(0)
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [pendingClients, setPendingClients] = useState<Array<{
    id: string
    region: string
    duration: string
    purchaseTime: Date
  }>>([])
  const [isPurchaseLoading, setIsPurchaseLoading] = useState<boolean>(false)

  const tooltipSteps: TooltipStep[] = [
    {
      id: "duration-tooltip",
      content: "Choose how long you want your VPN access to last. Longer durations offer better value!",
      placement: "top"
    },
    {
      id: "price-tooltip", 
      content: "This shows the cost in ADA for your selected duration. Make sure you have enough balance!",
      placement: "bottom"
    },
    {
      id: "region-tooltip",
      content: "Select the server region closest to you for the best performance, or choose a different region for location privacy.",
      placement: "top"
    },
    {
      id: "wallet-tooltip",
      content: "Connect your Cardano wallet here to start purchasing VPN access. We support all major Cardano wallets!",
      placement: "left"
    },
    {
      id: "purchase-tooltip",
      content: "Click here to purchase your VPN access! Make sure your wallet is connected and you have enough ADA balance.",
      placement: "top"
    },
    {
      id: "instances-tooltip",
      content: "Your active VPN instances will appear here. Click 'Get Config' to download your VPN configuration files!",
      placement: "top"
    }
  ]

  const { data: refData } = useRefData({
    queryKey: ['refdata'],
    enabled: true,
  })

  const signupMutation = useSignup({
    onSuccess: async (data) => {
      
      try {
        await signAndSubmitTransaction(data.txCbor)
        showSuccess(`VPN purchase successful! Setting up your instance...`)
        
        // Add pending client to the list
        const pendingClient = {
          id: data.clientId,
          region: selectedRegion,
          duration: selectedOption ? formatDuration(selectedOption.value) : 'Unknown',
          purchaseTime: new Date()
        }
        setPendingClients(prev => [...prev, pendingClient])
        
        // Start polling for this client
        startPolling(data.clientId)
        
        // Clear loading state after successful purchase
        setIsPurchaseLoading(false)
        
      } catch (error) {
        console.error('Transaction error details:', error)
        showError('Failed to sign and submit transaction')
        setIsPurchaseLoading(false)
      }
    },
    onError: (error) => {
      console.error('Signup failed:', error)
      showError('Failed to sign and submit transaction')
      setIsPurchaseLoading(false)
    }
  })

  const { data: clientList, isLoading: isLoadingClients } = useClientList(
    { clientAddress: walletAddress || '' },
    { enabled: !!walletAddress && isConnected }
  )

  const dedupedClientList = useMemo(() => {
    const seenIds = new Set<string>()
    return (clientList || []).filter((client) => {
      if (seenIds.has(client.id)) return false
      seenIds.add(client.id)
      return true
    })
  }, [clientList])

  const formatDuration = (durationMs: number) => {
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return days === 1 ? "1 day" : `${days} days`
    }
    return hours === 1 ? "1 hour" : `${hours} hours`
  }

  const formatTimeDisplay = (durationMs: number) => {
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`
    }
    
    if (hours >= 24) {
      return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''}`
    }
    
    return `${hours.toString().padStart(2, '0')}:00:00`
  }
  
  const formatPrice = (priceLovelace: number) => {
    return (priceLovelace / 1000000).toFixed(2)
  }

  const durationOptions = useMemo(() => {
    if (!Array.isArray(refData?.prices)) return []
    
    return refData.prices.map((priceData: { duration: number; price: number }) => ({
      label: formatDuration(priceData.duration),
      value: priceData.duration,
      timeDisplay: formatTimeDisplay(priceData.duration),
      price: priceData.price
    }))
  }, [refData?.prices])

  useEffect(() => {
    if (durationOptions.length > 0 && selectedDuration === 0) {
      setSelectedDuration(durationOptions[0].value)
    }
  }, [durationOptions, selectedDuration])

  useEffect(() => {
    if (Array.isArray(refData?.regions) && refData.regions.length > 0 && !selectedRegion) {
      setSelectedRegion(refData.regions[0])
    }
  }, [refData?.regions, selectedRegion])

  // Remove pending clients when they become available in the client list
  useEffect(() => {
    if (dedupedClientList && pendingClients.length > 0) {
      const availableClientIds = new Set(dedupedClientList.map(client => client.id))
      const removedClients = pendingClients.filter(pending => availableClientIds.has(pending.id))
      
      if (removedClients.length > 0) {
        setPendingClients(prev => 
          prev.filter(pending => !availableClientIds.has(pending.id))
        )
      }
    }
  }, [dedupedClientList, pendingClients])

  const selectedOption = durationOptions.find((option: { value: number }) => option.value === selectedDuration)

  const handlePurchase = () => {
    if (!walletAddress) {
      showError('No wallet address available')
      return
    }

    if (!selectedOption) {
      showError('Please select a duration')
      return
    }

    if (!selectedRegion) {
      showError('Please select a region')
      return
    }

    // Start loading state for entire purchase process
    setIsPurchaseLoading(true)

    const payload = {
      clientAddress: walletAddress,
      duration: selectedDuration,
      price: selectedOption.price,
      region: selectedRegion
    }

    signupMutation.mutate(payload)
  }

  const clientProfileMutation = useClientProfile()
  const { startPolling } = useClientPolling()

  const handleAction = async (instanceId: string, action: string) => {
    if (action === 'Get Config') {
      try {
        const s3Url = await clientProfileMutation.mutateAsync(instanceId)
        
        const link = document.createElement('a')
        link.href = s3Url
        link.download = `vpn-config-${instanceId}.conf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        showSuccess('VPN config downloaded successfully!')
      } catch (error) {
        console.error('Failed to get config:', error)
        showError('Failed to get VPN config. Please try again.')
      }
    } else if (action === 'Renew Access') {
      // TODO: Implement renew access
    }
  }

  const handleDisconnect = () => {
    disconnect()
    closeWalletModal()
  }

  const formatTimeRemaining = (expirationDate: string) => {
    const now = new Date()
    const expiration = new Date(expirationDate)
    const diffMs = expiration.getTime() - now.getTime()
    
    if (diffMs <= 0) {
      return 'Expired'
    }
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const vpnInstances = useMemo(() => {
    const activeInstances = dedupedClientList ? dedupedClientList
      .map((client: ClientInfo) => {
        const isActive = new Date(client.expiration) > new Date()
        
        return {
          id: client.id,
          region: client.region,
          duration: formatTimeRemaining(client.expiration),
          status: isActive ? 'Active' as const : 'Expired' as const,
          expires: new Date(client.expiration).toLocaleDateString(),
          expirationDate: new Date(client.expiration)
        }
      })
      .sort((a, b) => {
        if (a.status === 'Active' && b.status === 'Expired') return -1
        if (a.status === 'Expired' && b.status === 'Active') return 1
        
        if (a.status === 'Active') {
          return b.expirationDate.getTime() - a.expirationDate.getTime()
        } else {
          return b.expirationDate.getTime() - a.expirationDate.getTime()
        }
      }) : []

    // Add pending instances
    const pendingInstances = pendingClients.map(pending => ({
      id: pending.id,
      region: pending.region,
      duration: pending.duration,
      status: 'Pending' as const,
      expires: 'Setting up...',
      expirationDate: new Date(pending.purchaseTime.getTime() + 24 * 60 * 60 * 1000) // Placeholder
    }))

    // Combine and sort: Pending first, then Active, then Expired
    return [...pendingInstances, ...activeInstances].sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1
      if (a.status !== 'Pending' && b.status === 'Pending') return 1
      if (a.status === 'Active' && b.status === 'Expired') return -1
      if (a.status === 'Expired' && b.status === 'Active') return 1
      
      if (a.status === 'Active') {
        return b.expirationDate.getTime() - a.expirationDate.getTime()
      } else {
        return b.expirationDate.getTime() - a.expirationDate.getTime()
      }
    })
  }, [dedupedClientList, pendingClients])

  return (
    <TooltipGuide
      steps={tooltipSteps}
      storageKey="vpn-account-visited"
      stepDuration={4000}
    >
      {(showTooltips) => (
        <div className="min-h-screen min-w-screen flex flex-col items-center justify-start bg-[linear-gradient(180deg,#1C246E_0%,#040617_12.5%)] pt-16">
          <div className="flex flex-col items-center justify-center pt-8 gap-6 md:pt-12 md:gap-8 z-20 text-white w-full max-w-none md:max-w-[80rem] px-4 md:px-8">
            <LoadingOverlay 
              isVisible={isPurchaseLoading}
              messageTop="Awaiting Transaction Confirmation"
              messageBottom="Processing Purchase"
            />
            
            {/* VPN PURCHASE SECTION */}
            <div className="flex flex-col gap-6 w-full md:flex-row md:gap-8 md:items-start">
              {/* VPN PURCHASE OPTIONS */}
              <div className="flex flex-col justify-center items-start gap-3 w-full md:flex-1">
                <div className="flex justify-between items-start gap-3 pb-4 w-full">
                  <div className="flex flex-col justify-center items-start gap-3">
                    <p className="font-exo-2 text-white text-lg font-bold">Buy VPN Access</p>
                  </div>
                  <div className="flex flex-col justify-center items-end gap-3">
                    <p className="font-light text-white text-sm">Available Balance</p>
                    <p className="font-light text-white text-sm">
                      <span className="font-bold text-2xl">{balance ? balance : "0.00"}</span> ADA
                    </p>
                  </div>
                </div>
                
                {/* Duration Selection */}
                <div 
                  className="flex flex-col justify-center items-start gap-2 p-3 w-full rounded-md bg-[linear-gradient(180deg,rgba(148,0,255,0.60)_0%,rgba(104,0,178,0.60)_100%)]"
                  {...(showTooltips && { 'data-tooltip-id': 'duration-tooltip' })}
                >
                  <div className="flex flex-col justify-center items-start gap-2 w-full">
                    {Array.isArray(refData?.prices) && refData.prices.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2 w-full">
                          {durationOptions.map((option: { value: number; label: string; timeDisplay: string }) => (
                            <button
                              key={option.value}
                              className={`flex items-center justify-center gap-2.5 flex-1 rounded-sm bg-white text-black py-1.5 px-3 cursor-pointer whitespace-nowrap text-md md:text-md ${
                                selectedDuration === option.value ? "opacity-100" : "opacity-50"
                              }`}
                              onClick={() => setSelectedDuration(option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <div 
                          className="text-lg flex justify-center items-center gap-2 w-full bg-[#000000A6] rounded-md py-3 px-2.5"
                          {...(showTooltips && { 'data-tooltip-id': 'price-tooltip' })}
                        >
                          {selectedOption ? `${formatPrice(selectedOption.price)} ADA` : ''}
                        </div>
                      </>
                    ) : (
                      <div className="h-20 w-full bg-gray-300/20 rounded animate-pulse"></div>
                    )}
                  </div>
                </div>
                
                {/* Region Selection and Purchase */}
                <div className="flex flex-row gap-2 w-full justify-between items-center">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white text-lg">Region:</p>
                    {Array.isArray(refData?.regions) && refData.regions.length > 0 ? (
                      <select 
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="bg-transparent text-white text-md border border-white/20 rounded px-2 py-3"
                        {...(showTooltips && { 'data-tooltip-id': 'region-tooltip' })}
                      >
                        {refData.regions.map((region) => (
                          <option key={region} value={region} className="text-black">
                            {region.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="h-7 w-24 bg-gray-300/20 rounded animate-pulse"></div>
                    )}
                  </div>
                  {Array.isArray(refData?.prices) && refData.prices.length > 0 ? (
                    <button 
                      className={`flex items-center justify-center gap-2.5 rounded-md py-1 px-2.5 backdrop-blur-sm transition-all duration-200 ${
                        signupMutation.isPending || !isConnected 
                          ? 'opacity-50 cursor-not-allowed bg-gray-500 py-2 px-10' 
                          : 'cursor-pointer bg-[#9400FF] py-2 px-10 hover:bg-[#7A00CC] hover:scale-102'
                      }`}
                      onClick={handlePurchase}
                      disabled={signupMutation.isPending || !isConnected}
                      {...(showTooltips && { 'data-tooltip-id': 'purchase-tooltip' })}
                    >
                      <p className="font-medium text-white text-lg">
                        {signupMutation.isPending 
                          ? 'Processing...' 
                          : !isConnected 
                            ? 'Connect Wallet' 
                            : `Purchase VPN`
                        }
                      </p>
                    </button>
                  ) : (
                    <div className="h-8 w-32 bg-gray-300/20 rounded-md animate-pulse"></div>
                  )}
                </div>
              </div>
              
              {/* WALLET SECTION */}
              <div 
                className={`flex flex-col items-center justify-center w-full md:flex-1 ${
                  !isConnected ? 'flex' : (!isWalletModalOpen ? 'hidden md:flex' : 'flex')
                }`}
                {...(showTooltips && { 'data-tooltip-id': 'wallet-tooltip' })}
              >
                <WalletModal
                  isOpen={true}
                  onDisconnect={handleDisconnect}
                />
              </div>
            </div>
            
            {/* VPN INSTANCES SECTION */}
            <div className="flex flex-col justify-center items-start gap-3 w-full">
              <p className="text-white text-lg font-bold">VPN Instances</p>
              <div className="w-full">
                {!isConnected ? (
                  <p className="text-white/60 text-sm">Connect your wallet to view VPN instances</p>
                ) : isLoadingClients ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {[1, 2, 3, 4].map((index) => (
                      <div key={index} className="flex p-4 flex-col justify-center items-start gap-3 w-full rounded-md backdrop-blur-xs bg-[rgba(255,255,255,0.20)]">
                        <div className="flex flex-col items-start gap-1 w-full">
                          <div className="flex justify-between items-start w-full gap-2">
                            <div className="h-4 bg-gray-300/20 rounded animate-pulse w-20"></div>
                            <div className="h-4 bg-gray-300/20 rounded animate-pulse w-24"></div>
                          </div>
                          <div className="flex justify-between items-start w-full">
                            <div className="flex items-center gap-2">
                              <div className="h-4 bg-gray-300/20 rounded animate-pulse w-16"></div>
                              <div className="w-2 h-2 bg-gray-300/20 rounded-full animate-pulse"></div>
                            </div>
                            <div className="h-4 bg-gray-300/20 rounded animate-pulse w-20"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center w-full">
                          <div className="w-5 h-5 bg-gray-300/20 rounded animate-pulse"></div>
                          <div className="h-8 bg-gray-300/20 rounded-md animate-pulse w-24"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : vpnInstances.length > 0 ? (
                  <div 
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
                    {...(showTooltips && { 'data-tooltip-id': 'instances-tooltip' })}
                  >
                    {vpnInstances.map((instance) => (
                      <VpnInstance
                        key={instance.id}
                        region={instance.region}
                        duration={instance.duration}
                        status={instance.status}
                        expires={instance.expires}
                        onAction={() => handleAction(instance.id, instance.status === 'Active' ? 'Get Config' : 'Renew Access')}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">No VPN instances found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </TooltipGuide>
  )
}

export default Account