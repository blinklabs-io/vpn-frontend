import { Link, useLocation } from 'react-router'
import { useEffect } from 'react'
import nabuLogo from '/nabu-logo.svg'
import cardanoIcon from '/cardano-icon.svg'
import WalletConnection from './WalletConnection'
import { useWalletStore } from '../stores/walletStore'

const Navigation = () => {
  const location = useLocation()
  const isAccountPage = location.pathname === '/account'
  const { isWalletModalOpen, toggleWalletModal, closeWalletModal, reconnectWallet } = useWalletStore()

  useEffect(() => {
    reconnectWallet()
  }, [reconnectWallet])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isWalletModalOpen) {
        closeWalletModal()
      }
    }

    window.addEventListener('resize', handleResize)
    
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isWalletModalOpen, closeWalletModal])

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-[#00000033]">
      <div className="flex max-w-[80rem] justify-between items-center flex-1 self-stretch mx-auto p-4">
        <Link to="/">
          <img src={nabuLogo} alt="Nabu Logo" className="w-[10.75rem] h-[2.5rem]" />
        </Link>
        {isAccountPage ? (
          <button
            onClick={toggleWalletModal}
            className={`md:hidden flex items-center justify-center cursor-pointer transition-all duration-200 ${
              isWalletModalOpen
                ? 'w-12 h-12 rounded-full border-[1px] border-white'
                : 'w-12 h-12'
            }`}
          >
            <div className={`flex items-center justify-center bg-white rounded-full transition-all duration-200 ${
              isWalletModalOpen ? 'w-9 h-9' : 'w-12 h-12'
            }`}>
              <img
                src={cardanoIcon}
                alt="Cardano"
                className="w-[1.875rem] h-[1.725rem] shrink-0"
              />
            </div>
          </button>
        ) : (
          <WalletConnection />
        )}
      </div>
    </nav>
  )
}

export default Navigation