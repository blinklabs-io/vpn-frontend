import { useState, useEffect, useMemo } from "react"
import { useWalletStore } from "../stores/walletStore"
import { useRefData, useSignup, useClientList, useClientProfile, useClientPolling, useRenewVpn } from "../api/hooks"
import VpnInstance from "../components/VpnInstance"
import WalletModal from "../components/WalletModal"
import { showSuccess, showError } from "../utils/toast"
import type { ClientInfo } from '../api/types'
import LoadingOverlay from "../components/LoadingOverlay"
import TooltipGuide, { type TooltipStep } from "../components/TooltipGuide"
import { 
  getPendingTransactions, 
  addPendingTransaction, 
  removePendingTransaction,
  cleanupCompletedTransactions 
} from "../utils/pendingTransactions"
import InstanceFilter from "../components/InstanceFilter"
import RegionSelect from "../components/RegionSelect"
import { sortVpnInstances, filterOptions, type SortOption } from "../utils/instanceSort"

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
  const [isPurchaseLoading, setIsPurchaseLoading] = useState<boolean>(false)
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false)
  
  // Get pending clients from localStorage (will be reactive to changes)
  const [pendingClientsFromStorage, setPendingClientsFromStorage] = useState(() => 
    getPendingTransactions().filter(tx => tx.status === 'pending')
  )
  // Renewal state
  const [renewingInstanceId, setRenewingInstanceId] = useState<string | null>(null)
  const [selectedRenewDuration, setSelectedRenewDuration] = useState<number | null>(null)
  const [filterOption, setFilterOption] = useState<{value: string, label: string}>(filterOptions[0])

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

  // Initialize hooks first
  const clientProfileMutation = useClientProfile()
  const { startPolling } = useClientPolling()

  const signupMutation = useSignup({
    onSuccess: async (data) => {
      
      try {
        await signAndSubmitTransaction(data.txCbor)
        showSuccess(`VPN purchase successful! Setting up your instance...`)
        
        // Add pending client to localStorage
        const pendingClient = {
          id: data.clientId,
          region: selectedRegion,
          duration: selectedOption ? formatDuration(selectedOption.value) : 'Unknown',
          purchaseTime: new Date().toISOString()
        }
        addPendingTransaction(pendingClient)
        
        setPendingClientsFromStorage(getPendingTransactions().filter(tx => tx.status === 'pending'))
        
        startPolling(data.clientId)
        
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
  

  const renewMutation = useRenewVpn({
    onSuccess: async (data, variables) => {
      try {
        await signAndSubmitTransaction(data.txCbor)
        showSuccess('VPN renewal successful! Activating your instance...')
        const pendingClient = {
          id: variables.clientId,
          region: variables.region,
          duration: formatDuration(variables.duration),
          purchaseTime: new Date().toISOString()
        }
        addPendingTransaction(pendingClient)
        setPendingClientsFromStorage(getPendingTransactions().filter(tx => tx.status === 'pending'))
        startPolling(variables.clientId)
        setIsPurchaseLoading(false)
      } catch (error) {
        console.error('Transaction error details:', error)
        showError('Failed to sign and submit transaction')
        setIsPurchaseLoading(false)
      }
    },
    onError: (error) => {
      console.error('Renew failed:', error)
      showError('Failed to build renewal transaction')
      setIsPurchaseLoading(false)
    }
  })

  const { data: clientList, isLoading: isLoadingClients } = useClientList(
    { ownerAddress: walletAddress || '' },
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

  useEffect(() => {
    cleanupCompletedTransactions()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setPendingClientsFromStorage(getPendingTransactions().filter(tx => tx.status === 'pending'))
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (dedupedClientList && pendingClientsFromStorage.length > 0) {
      const availableClientIds = new Set(dedupedClientList.map(client => client.id))
      
      pendingClientsFromStorage.forEach(pending => {
        if (availableClientIds.has(pending.id)) {
          console.log(`Removing completed transaction ${pending.id} from localStorage`)
          removePendingTransaction(pending.id)
        }
      })
      
      setPendingClientsFromStorage(getPendingTransactions().filter(tx => tx.status === 'pending'))
    }
  }, [dedupedClientList, pendingClientsFromStorage])

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
      paymentAddress: walletAddress,
      duration: selectedDuration,
      price: selectedOption.price,
      region: selectedRegion
    }

    signupMutation.mutate(payload)
  }

  const handleAction = async (instanceId: string, action: string) => {
    if (action === 'Get Config') {
      try {
        setIsConfigLoading(true)
        const s3Url = await clientProfileMutation.mutateAsync(instanceId)
        
        const link = document.createElement('a')
        link.href = s3Url
        link.download = `vpn-config-${instanceId}.conf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        showSuccess('VPN config downloaded successfully!')
        setIsConfigLoading(false)
      } catch (error) {
        console.error('Failed to get config:', error)
        showError('Failed to get VPN config. Please try again.')
        setIsConfigLoading(false)
      }
    } else if (action === 'Renew Access') {
      // Toggle renewal expansion for this instance
      setRenewingInstanceId(instanceId)
      setSelectedRenewDuration(null)
    }
  }

  const handleCancelRenewal = () => {
    setRenewingInstanceId(null)
    setSelectedRenewDuration(null)
  }

  const handleConfirmRenewal = () => {
    if (!walletAddress) {
      showError('No wallet address available')
      return
    }
    
    if (!renewingInstanceId || !selectedRenewDuration) {
      showError('Please select a renewal duration')
      return
    }

    const renewOption = durationOptions.find(opt => opt.value === selectedRenewDuration)
    if (!renewOption) {
      showError('Invalid duration selected')
      return
    }

    const instanceRegion = dedupedClientList?.find(c => c.id === renewingInstanceId)?.region || selectedRegion
    if (!instanceRegion) {
      showError('Could not determine region for renewal')
      return
    }

    setIsPurchaseLoading(true)
    renewMutation.mutate({
      paymentAddress: walletAddress,
      clientId: renewingInstanceId,
      duration: selectedRenewDuration,
      price: renewOption.price,
      region: instanceRegion,
    })
    
    // Reset renewal state
    setRenewingInstanceId(null)
    setSelectedRenewDuration(null)
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
          expirationDate: new Date(client.expiration),
          originalDuration: client.duration || 0
        }
      }) : []

    const activeClientIds = new Set(activeInstances.map(instance => instance.id))
    
    const pendingInstances = pendingClientsFromStorage
      .filter(pending => !activeClientIds.has(pending.id))
      .map(pending => ({
        id: pending.id,
        region: pending.region,
        duration: pending.duration,
        status: 'Pending' as const,
        expires: 'Setting up...',
        expirationDate: new Date(new Date(pending.purchaseTime).getTime() + 24 * 60 * 60 * 1000),
        originalDuration: 0
      }))

    const allInstances = [...pendingInstances, ...activeInstances]
    
    return sortVpnInstances(allInstances, filterOption.value as SortOption)
  }, [dedupedClientList, pendingClientsFromStorage, filterOption])

  return (
    <TooltipGuide
      steps={tooltipSteps}
      storageKey="vpn-account-visited"
      stepDuration={4000}
    >
      {(showTooltips) => (
        <div className="min-h-screen min-w-screen flex flex-col items-center justify-start bg-[linear-gradient(180deg,#1C246E_0%,#040617_12.5%)] pt-16">
          <div className="flex flex-col items-center justify-center pt-4 gap-4 md:pt-12 md:gap-8 z-20 text-white w-full max-w-none md:max-w-[80rem] px-3 md:px-8">
            <LoadingOverlay 
              isVisible={isPurchaseLoading || isConfigLoading}
              messageTop={isPurchaseLoading ? "Awaiting Transaction Confirmation" : "Preparing VPN Configuration"}
              messageBottom={isPurchaseLoading ? "Processing Purchase" : "Downloading Config File"}
            />
            
            {/* VPN PURCHASE SECTION */}
            <div className="flex flex-col gap-4 w-full md:flex-row md:gap-8 md:items-start">
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
                        <div className="flex flex-wrap items-center gap-2 w-full">
                          {durationOptions.map((option: { value: number; label: string; timeDisplay: string }) => (
                            <button
                              key={option.value}
                              className={`flex items-center justify-center gap-2.5 flex-1 min-w-0 rounded-sm bg-white text-black py-1.5 px-2 cursor-pointer whitespace-nowrap text-sm md:text-md md:px-3 ${
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
                <div className="flex flex-col gap-3 w-full md:flex-row md:gap-2 md:justify-between md:items-center">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white text-lg">Region:</p>
                    {Array.isArray(refData?.regions) && refData.regions.length > 0 ? (
                      <RegionSelect
                        value={selectedRegion}
                        onChange={setSelectedRegion}
                        regions={refData.regions}
                        showTooltips={showTooltips}
                      />
                    ) : (
                      <div className="h-7 w-24 bg-gray-300/20 rounded animate-pulse"></div>
                    )}
                  </div>
                  {Array.isArray(refData?.prices) && refData.prices.length > 0 ? (
                    <button 
                      className={`flex items-center justify-center gap-2.5 rounded-md py-2 px-6 backdrop-blur-sm transition-all duration-200 w-full md:w-auto ${
                        signupMutation.isPending || !isConnected 
                          ? 'opacity-50 cursor-not-allowed bg-gray-500' 
                          : 'cursor-pointer bg-[#9400FF] hover:bg-[#7A00CC] hover:scale-102'
                      }`}
                      onClick={handlePurchase}
                      disabled={signupMutation.isPending || !isConnected}
                      {...(showTooltips && { 'data-tooltip-id': 'purchase-tooltip' })}
                    >
                      <p className="font-medium text-white text-md">
                        {signupMutation.isPending 
                          ? 'Processing...' 
                          : !isConnected 
                            ? 'Connect Wallet' 
                            : `Purchase VPN`
                        }
                      </p>
                    </button>
                  ) : (
                    <div className="h-8 w-full md:w-32 bg-gray-300/20 rounded-md animate-pulse"></div>
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
            <div className="flex flex-col justify-center items-start gap-3 w-full mt-4 md:mt-0">
              <div className="flex justify-between items-center w-full">
                <p className="text-white text-lg font-bold">VPN Instances</p>
                {isConnected && vpnInstances.length > 0 && (
                  <InstanceFilter
                    value={filterOption}
                    onChange={(option) => setFilterOption(option || filterOptions[0])}
                  />
                )}
              </div>
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
                        isRenewExpanded={renewingInstanceId === instance.id}
                        renewDurationOptions={durationOptions}
                        selectedRenewDuration={selectedRenewDuration}
                        onSelectRenewDuration={setSelectedRenewDuration}
                        onConfirmRenewal={handleConfirmRenewal}
                        onCancelRenewal={handleCancelRenewal}
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
