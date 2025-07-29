import { useState, useEffect, useMemo } from "react"
import { useWalletStore } from "../stores/walletStore"
import { useRefData } from "../api/hooks/useRefData"
import VpnInstance from "../components/VpnInstance"
import TransactionHistory from "../components/TransactionHistory"
import WalletConnection from "../components/WalletConnection"
import WalletModal from "../components/WalletModal"

const Account = () => {
  const { isConnected, isWalletModalOpen, disconnect, closeWalletModal, balance } = useWalletStore()
  const [selectedDuration, setSelectedDuration] = useState<number>(0)
  const [selectedRegion, setSelectedRegion] = useState<string>("")

  const { data: refData } = useRefData({
    queryKey: ['refdata'],
    enabled: isConnected,
  })

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
    if (!refData?.prices) return []
    
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
    if (refData?.regions && refData.regions.length > 0 && !selectedRegion) {
      setSelectedRegion(refData.regions[0])
    }
  }, [refData?.regions, selectedRegion])

  const selectedOption = durationOptions.find((option: { value: number }) => option.value === selectedDuration)
  const currentPrice = selectedOption ? formatPrice(selectedOption.price) : "0.00"

  const handleDelete = (instanceId: string) => {
    console.log('Delete instance:', instanceId)
  }

  const handleAction = (instanceId: string, action: string) => {
    console.log(`${action} for instance:`, instanceId)
  }

  const handleDisconnect = () => {
    disconnect()
    closeWalletModal()
  }

  //mock vpn instances data
  const vpnInstances = [
    {
      id: 'instance-1',
      region: selectedRegion || 'us east-1',
      duration: '1 day',
      status: 'Active' as const,
      expires: '1 day'
    },
    {
      id: 'instance-2', 
      region: 'us east-2',
      duration: '6 hours',
      status: 'Expired' as const,
      expires: 'Expired'
    }
  ]

  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center justify-start bg-[linear-gradient(180deg,#1C246E_0%,#040617_12.5%)] pt-16">
      {/* Wallet Modal */}
      <div className="flex flex-col items-center justify-center py-8 gap-6 md:py-8 md:gap-8 z-20 text-white w-full max-w-none md:max-w-[80rem] px-4 md:px-8">
        <WalletModal
          isOpen={isWalletModalOpen}
          onDisconnect={handleDisconnect}
        />
      </div>

      <div className="flex flex-col items-center justify-center pt-8 gap-6 md:pt-12 md:gap-8 z-20 text-white w-full max-w-none md:max-w-[80rem] px-4 md:px-8">
        {!isConnected ? (
          <WalletConnection
            variant="white"
            showTitle={true}
            showDescription={true}
          />
        ) : (
          <>
            {/* VPN CONTENT */}
            <div className="flex flex-col gap-6 w-full md:flex-row md:gap-8 md:items-start">
              {/* VPN CONTENT LEFT */}
              <div className="flex flex-col justify-center items-start gap-3 w-full md:flex-1">
                <div className="flex justify-between items-start gap-3 pb-4 w-full">
                  <div className="flex flex-col justify-center items-start gap-3">
                    <p className="font-exo-2 text-white text-lg font-bold">Buy VPN Access</p>
                  </div>
                  <div className="flex flex-col justify-center items-end gap-3">
                    <p className="font-light text-white text-sm">Available Balance</p>
                    <p className="font-light text-white text-sm">
                      <span className="font-bold text-4xl">{balance ? balance : "0.00"}</span> ADA
                    </p>
                  </div>
                </div>
                
                {/* Duration Selection */}
                <div className="flex flex-col justify-center items-start gap-2 p-3 w-full rounded-md bg-[linear-gradient(180deg,rgba(148,0,255,0.60)_0%,rgba(104,0,178,0.60)_100%)]">
                  <div className="flex flex-col justify-center items-start gap-2 w-full">
                    {refData?.prices ? (
                      <>
                        <div className="flex items-center gap-2 w-full">
                          {durationOptions.map((option: { value: number; label: string; timeDisplay: string }) => (
                            <button
                              key={option.value}
                              className={`flex items-center justify-center gap-2.5 flex-1 rounded-sm bg-white text-black py-1 px-2.5 cursor-pointer whitespace-nowrap text-xs md:text-sm ${
                                selectedDuration === option.value ? "opacity-100" : "opacity-50"
                              }`}
                              onClick={() => setSelectedDuration(option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-center items-center gap-2 w-full bg-[#000000A6] rounded-md py-2 px-2.5">
                          {selectedOption?.timeDisplay}
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
                    <p className="font-light text-white text-md">Regions:</p>
                    {refData?.regions ? (
                      <select 
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="bg-transparent text-white text-sm border border-white/20 rounded px-2 py-1"
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
                  {refData?.prices ? (
                    <button className="flex items-center justify-center gap-2.5 rounded-md bg-[#9400FF] text-black py-1 px-2.5 backdrop-blur-sm">
                      <p className="font-light text-white text-sm">Purchase {currentPrice} ADA</p>
                    </button>
                  ) : (
                    <div className="h-8 w-32 bg-gray-300/20 rounded-md animate-pulse"></div>
                  )}
                </div>
              </div>
              
              {/* VPN INSTANCES */}
              <div className="flex flex-col justify-center items-start gap-3 w-full md:flex-1">
                <p className="text-white text-lg font-bold md:text-base md:font-normal">VPN Instances</p>
                <div className="flex flex-col items-start gap-2 w-full">
                  {vpnInstances.map((instance) => (
                    <VpnInstance
                      key={instance.id}
                      region={instance.region}
                      duration={instance.duration}
                      status={instance.status}
                      expires={instance.expires}
                      onDelete={() => handleDelete(instance.id)}
                      onAction={() => handleAction(instance.id, instance.status === 'Active' ? 'Get Config' : 'Renew Access')}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-4 w-full">
              <TransactionHistory />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Account