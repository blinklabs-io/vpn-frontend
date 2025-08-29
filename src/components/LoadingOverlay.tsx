import cardanoIcon from '/cardano-icon.svg'

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
}

const LoadingOverlay = ({ isVisible, message }: LoadingOverlayProps) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <img src={cardanoIcon} alt="Cardano" className="w-16 h-16 animate-pulse brightness-0 invert" />
        </div>
        {message && (
          <div className="text-lg font-medium text-white">{message}</div>
        )}
      </div>
    </div>
  )
}

export default LoadingOverlay 