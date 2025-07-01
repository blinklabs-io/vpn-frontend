import { useState } from "react"
import { useWalletStore } from "../stores/walletStore"
import VpnInstance from "../components/VpnInstance"
import TransactionHistory from "../components/TransactionHistory"
import WalletConnection from "../components/WalletConnection"
import WalletModal from "../components/WalletModal"

const Account = () => {
  const { isConnected, isWalletModalOpen, disconnect, closeWalletModal } = useWalletStore()
  const [selectedDuration, setSelectedDuration] = useState<string>("1 hour")

  // Define duration options
  const durationOptions = [
    { label: "1 hour", value: "1 hour", timeDisplay: "01:00:00" },
    { label: "6 hours", value: "6 hours", timeDisplay: "06:00:00" },
    { label: "24 hours", value: "24 hours", timeDisplay: "24:00:00" }
  ]

  // Get the current time display based on selected duration
  const getCurrentTimeDisplay = () => {
    const selected = durationOptions.find(option => option.value === selectedDuration)
    return selected ? selected.timeDisplay : "01:00:00"
  }

  // Handler functions for VPN instances
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

  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center justify-start bg-[linear-gradient(180deg,#1C246E_0%,#040617_12.5%)] pt-16">
      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onDisconnect={handleDisconnect}
      />

      <div className="flex flex-col items-center justify-center py-8 gap-6 md:py-8 md:gap-8 z-20 text-white w-full max-w-none md:max-w-[80rem] px-4 md:px-8">
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
                    <p className="font-light text-white text-sm"><span className="font-bold text-4xl">83.42</span> ADA</p>
                  </div>
                </div>
                <div className="flex flex-col justify-center items-start gap-2 p-3 w-full rounded-md bg-[linear-gradient(180deg,rgba(148,0,255,0.60)_0%,rgba(104,0,178,0.60)_100%)]">
                  <div className="flex flex-col justify-center items-start gap-2 w-full">
                    <div className="flex items-center gap-2 w-full">
                      {durationOptions.map((option) => (
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
                      {getCurrentTimeDisplay()} hours
                    </div>
                  </div>
                </div>
                <div className="flex flex-row gap-2 w-full justify-between items-center">
                 <p className="font-light text-white text-sm">Region: US-East</p>
                 <button className="flex items-center justify-center gap-2.5 rounded-md bg-[#9400FF] text-black py-1 px-2.5 backdrop-blur-sm">
                  <p className="font-light text-white text-sm">Purchase 20.00 ADA</p>
                 </button>
                </div>
              </div>
              <div className="flex flex-col justify-center items-start gap-3 w-full md:flex-1">
                <p className="text-white text-lg font-bold md:text-base md:font-normal">VPN Instances</p>
                <div className="flex flex-col items-start gap-2 w-full">
                  <VpnInstance
                    region="US-East"
                    duration="1 day"
                    status="Active"
                    expires="1 day"
                    onDelete={() => handleDelete('instance-1')}
                    onAction={() => handleAction('instance-1', 'Get Config')}
                  />
                  <VpnInstance
                    region="EU-West"
                    duration="6 hours"
                    status="Expired"
                    expires="Expired"
                    onDelete={() => handleDelete('instance-2')}
                    onAction={() => handleAction('instance-2', 'Renew Access')}
                  />
                     <VpnInstance
                    region="EU-West"
                    duration="6 hours"
                    status="Expired"
                    expires="Expired"
                    onDelete={() => handleDelete('instance-2')}
                    onAction={() => handleAction('instance-2', 'Renew Access')}
                  />
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